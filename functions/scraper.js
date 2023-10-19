const puppeteer = require('puppeteer');

const scrapeData = async () => {
    const browser = await puppeteer.launch({
        headless: true
    });

    const page = await browser.newPage();

    await page.goto('https://classes.berkeley.edu/search/class/?f%5B0%5D=im_field_term_name%3A2885', {
        waitUntil: "domcontentloaded"
    });


    const body = await page.evaluate(() => {
        const pageReference = document.querySelector('.item-list .pager .pager-item a');
        const courseList = document.querySelectorAll('.layout-center__content .search-results .search-result');

        let nextPage = pageReference.getAttribute('href');

        const courseCodeList = Array.from(courseList).map((course) => {
            const courseCode = course.querySelector('.handlebarData .result-wrapper .hbr .col-wrapper .left-col .ls-term-year-section-wrapper .ls-section-name-number-code .ls-section-wrapper .ls-section-name');
            return courseCode.innerText;
        })

        const courseNameList = Array.from(courseList).map((course) => {
            const courseName = course.querySelector('.handlebarData .result-wrapper .hbr .col-wrapper .left-col .ls-course-title');
            return courseName.innerText;
        })

        const courseProfList = Array.from(courseList).map((course) => {
            const courseProf = course.querySelector('.handlebarData .result-wrapper .hbr .col-wrapper .left-col .ls-instructors');
            return courseProf.innerText;
        })

        // const imgReference = document.querySelector('#mp-otd #mp-otd-img img');
        // const listReference = document.querySelectorAll('#mp-otd > ul li');

        // let imgSource = imgReference.getAttribute('src');
        // imgSource = imgSource.replace('thumb/', '');
        // let fileExIndex = Math.max(imgSource.indexOf('.jpg/'), imgSource.indexOf('.JPG/'), imgSource.indexOf('.png/'), imgSource.indexOf('.PNG/'));

        // imgSource = imgSource.substring(0, fileExIndex + 4);

        // const list = Array.from(listReference).map((item) => {
        //     const itemLink = item.querySelector('b a').getAttribute('href');

        //     return {
        //         link: itemLink ? `https://en.wikipedia.org/${itemLink}` : undefined,
        //         text: item.innerText
        //     }
        // });

        return { pageReference, courseCodeList, courseNameList, courseProfList, nextPage };
    });

    browser.close();

    return body;

}

scrapeData().then((res) => {
    console.log(res);
});

exports.scrapeData = scrapeData;