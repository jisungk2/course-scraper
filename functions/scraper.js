const puppeteer = require('puppeteer');
const AUTH = 'brd-customer-hl_6765b38c-zone-scraping_browser:zadeuo6ud03d';
const SBR_WS_ENDPOINT = `wss://${AUTH}@brd.superproxy.io:9222`;

const scrapeData = async () => {
    const browser = await puppeteer.launch({
        headless: true,
        browserWSEndpoint: SBR_WS_ENDPOINT,
        args: [
            '--disable-dev-shm-usage'
        ]
    });

    const page = await browser.newPage();

    await page.goto('https://classes.berkeley.edu/search/class?f%5B0%5D=im_field_term_name%3A2885', {
        waitUntil: "domcontentloaded"
    });


    let courses = {courseCodeList: [], courseNameList: [], courseProfList: [], courseDepartmentList: []};
    while (true) {
        let courseList; 

        const codes = await page.evaluate(() => {

            courseList = document.querySelectorAll('.layout-center__content .search-results .search-result');

            const courseCodes = Array.from(courseList).map((course) => {
                const courseCode = course.querySelector('.handlebarData .result-wrapper .hbr .col-wrapper .left-col .ls-term-year-section-wrapper .ls-section-name-number-code .ls-section-wrapper .ls-section-name');
                return courseCode.innerText;
            })
            return courseCodes;
        });

        const names = await page.evaluate(() => {

            const courseNames = Array.from(courseList).map((course) => {
                const courseName = course.querySelector('.handlebarData .result-wrapper .hbr .col-wrapper .left-col .ls-course-title');
                return courseName.innerText;
            })
            return courseNames;
        });

        const profs = await page.evaluate(() => {

            const courseProfs = Array.from(courseList).map((course) => {
                const courseProf = course.querySelector('.handlebarData .result-wrapper .hbr .col-wrapper .left-col .ls-instructors');
                return (courseProf) ? courseProf.innerText : 'To Be Determined';
            })
            return courseProfs;
        });

        const departments = await page.evaluate(() => {

            const courseDepartments = Array.from(courseList).map((course) => {
                const courseDepartment = course.querySelector('.handlebarData .result-wrapper .hbr .col-wrapper .left-col .ls-term-year-section-wrapper .ls-section-name-number-code .ls-section-dept a');
                return courseDepartment.innerText;
            })
            return courseDepartments;
        });

        courses.courseDepartmentList = courses.courseDepartmentList.concat(departments);
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

        await page.goto(`https://classes.berkeley.edu${nextPageUrl}`, {
            waitUntil: "domcontentloaded"
        });

    }

    await browser.close();

    return courses;
}

scrapeData().then((res) => {
    console.log(res);
});


exports.scrapeData = scrapeData;