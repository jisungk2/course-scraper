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


    let courses = {courseListData: []};
    let i = 9
    while (i < 10) {

        const pageCourseInfo = await page.evaluate(() => {
            const courseList = document.querySelectorAll('.layout-center__content .search-results .search-result');

            const pageCourses = Array.from(courseList).map((course) => {
                const classNumber = course.querySelector('.handlebarData .result-wrapper .hbr .col-wrapper .left-col .ls-details-flex .ls-section-number'); //need to convert innertext to number
                let colonIndex = classNumber.innerText.indexOf(':');
                const classId = classNumber.innerText.substring(colonIndex + 1);

                const courseCode = course.querySelector('.handlebarData .result-wrapper .hbr .col-wrapper .left-col .ls-term-year-section-wrapper .ls-section-name-number-code .ls-section-wrapper .ls-section-name');
                const courseName = course.querySelector('.handlebarData .result-wrapper .hbr .col-wrapper .left-col .ls-course-title');
                const courseProf = course.querySelector('.handlebarData .result-wrapper .hbr .col-wrapper .left-col .ls-instructors');
                const courseRoom = course.querySelector('.handlebarData .result-wrapper .hbr .col-wrapper .left-col .ls-details-flex .ls-meeting-details-flex .ls-meeting-details .ls-location');
                const courseDepartment = course.querySelector('.handlebarData .result-wrapper .hbr .col-wrapper .left-col .ls-term-year-section-wrapper .ls-section-name-number-code .ls-section-dept a');

                const credits = course.querySelector('.handlebarData .result-wrapper .hbr .col-wrapper .left-col .ls-details-flex .ls-details-units');

                let creditColon = credits.innerText.indexOf(':');
                const units = credits.innerText.substring(creditColon + 1);
                
                const courseDay = course.querySelector('.handlebarData .result-wrapper .hbr .col-wrapper .left-col .ls-details-flex .ls-meeting-details-flex .ls-meeting-details .ls-days');
                const courseTime = course.querySelector('.handlebarData .result-wrapper .hbr .col-wrapper .left-col .ls-details-flex .ls-meeting-details-flex .ls-meeting-details .ls-time');

                startTimes = [];
                endTimes = [];
                const cleanCourses = courseDay.innerText.trim();
                const dayList = cleanCourses.split(", ")

                if (courseDay && courseTime) {

                    const courseTimeClean = courseTime.innerText.trim();

                    let splitIndex = courseTimeClean.indexOf('-');
                    const startTime = courseTimeClean.substring(0, splitIndex - 4);
                    const startTimeColon = startTime.indexOf(":");
                    let startHour = startTime.substring(0, startTimeColon);
                    let startMinute = startTime.substring(startTimeColon + 1);
                    const startTimeOfDay = courseTimeClean.substring(splitIndex - 3, splitIndex - 1);


                    const endTime = courseTimeClean.substring(splitIndex + 1, courseTimeClean.length - 3).trim();
                    const endTimeColon = endTime.indexOf(":");
                    let endHour = endTime.substring(0, endTimeColon);
                    let endMinute = endTime.substring(endTimeColon + 1);
                    const endTimeOfDay = courseTimeClean.substring(courseTimeClean.length - 2);

                    for (day in dayList) {
                        if (day.trim().localeCompare("M") == 0) {
                            day = "MON";
                        } else if (day.trim().localeCompare("TU") == 0) {
                            day = "TUE";
                        } else if (day.trim().localeCompare("W") == 0) {
                            day = "WED";
                        } else if (day.trim().localeCompare("TH") == 0) {
                            day = "THU";
                        } else if (day.trim().localeCompare("F") == 0){
                            day = "FRI";
                        }
                        
                        if (startTimeOfDay === "pm" && parseInt(startHour) < 12) {
                            let temp = (parseInt(startHour) + 12)
                            startHour = temp.toString();
                        } else if (startTimeOfDay === "am" && parseInt(startHour) < 10) {
                            startHour = "0".concat(startHour);
                        }
                        if (parseInt(startMinute) == 0) {
                            startMinute = "00";
                        }


                        if (endTimeOfDay === "pm" && parseInt(endHour) < 12) {
                            let temp = (parseInt(endHour) + 12)
                            endHour = temp.toString();
                        } else if (endTimeOfDay === "am" && parseInt(endHour) < 10) {
                            endHour = "0".concat(endHour);
                        }
                        if (parseInt(endMinute) == 0) {
                            endMinute = "00";
                        }

                        startTimes.push(day.concat(startHour).concat(startMinute));
                        endTimes.push(day.concat(endHour).concat(endMinute));
                    }
                }


                return {
                    id: parseInt(classId),
                    course: courseName.innerText,
                    courseCode: courseCode.innerText,
                    professorName: (courseProf) ? courseProf.innerText : null,
                    courseRoom: (courseRoom) ? courseRoom.innerText : null,
                    startTime: (courseDay && courseTime) ? startTimes[0] : null,
                    endTime: (courseDay && courseTime) ? endTimes : null,
                    credits: parseInt(units),
                    type: courseDepartment.innerText,
                    grade: null,
                    days: dayList
                }
            })
            return pageCourses;
        });

        courses.courseListData = courses.courseListData.concat(pageCourseInfo);

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

        i += 1
    }

    await browser.close();

    return courses;
}

scrapeData().then((res) => {
    console.log(res);
});


exports.scrapeData = scrapeData;