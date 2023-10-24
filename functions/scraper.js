const puppeteer = require('puppeteer');

const scrapeData = async () => {
    const browser = await puppeteer.launch({
        headless: true
    });

    const page = await browser.newPage();

    await page.goto('https://classes.berkeley.edu/search/class/?f%5B0%5D=im_field_term_name%3A2885', {
        waitUntil: "domcontentloaded"
    });


    let courses = {courseCodeList: [], courseNameList: [], courseProfList: []};
    while (true) {
        const codes = await page.evaluate(() => {
            
            const courseList = document.querySelectorAll('.layout-center__content .search-results .search-result');

            const courseCodes = Array.from(courseList).map((course) => {
                const courseCode = course.querySelector('.handlebarData .result-wrapper .hbr .col-wrapper .left-col .ls-term-year-section-wrapper .ls-section-name-number-code .ls-section-wrapper .ls-section-name');
                return courseCode.innerText;
            })
            return courseCodes;
        });

        const names = await page.evaluate(() => {
            
            const courseList = document.querySelectorAll('.layout-center__content .search-results .search-result');

            const courseNames = Array.from(courseList).map((course) => {
                const courseName = course.querySelector('.handlebarData .result-wrapper .hbr .col-wrapper .left-col .ls-course-title');
                return courseName.innerText;
            })
            return courseNames;
        });

        const profs = await page.evaluate(() => {
            
            const courseList = document.querySelectorAll('.layout-center__content .search-results .search-result');

            const courseProfs = Array.from(courseList).map((course) => {
                const courseProf = course.querySelector('.handlebarData .result-wrapper .hbr .col-wrapper .left-col .ls-instructors');
                return (courseProf) ? courseProf.innerText : 'To Be Determined';
            })
            return courseProfs;
        });

        courses.courseCodeList = courses.courseCodeList.concat(codes);
        courses.courseNameList = courses.courseNameList.concat(names);
        courses.courseProfList = courses.courseProfList.concat(profs);

        const nextPageUrl = await page.evaluate(() => {
            const pageReference = document.querySelector('.item-list .pager .pager-next a');
            if (!pageReference) {
                return;
            }
            let nextPage = pageReference.getAttribute('href');
    
            return nextPage;
        })

        if (!nextPageUrl) {
            break;
        }

        // await page.goto(`https://classes.berkeley.edu${nextPageUrl}`, {
        //     waitUntil: "domcontentloaded"
        // });

        const response = await retry(() => page.goto(`https://classes.berkeley.edu${nextPageUrl}`, {
            waitUntil: "domcontentloaded"
        }), 1000);
    }

    browser.close();

    return courses;
}

const retry = (fn, ms) => new Promise(resolve => { 
    fn()
      .then(resolve)
      .catch(() => {
        setTimeout(() => {
          console.log('retrying...');
          retry(fn, ms).then(resolve);
        }, ms);
      })
  });

scrapeData().then((res) => {
    console.log(res);
});


exports.scrapeData = scrapeData;