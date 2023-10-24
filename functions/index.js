const functions = require("firebase-functions");
const scraper = require("./scraper");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const getToday = () => {
    const today = new Date();
    
    return `${today.getDate()}${today.getMonth() + 1}${today.getFullYear()}`;
};

exports.pubsub = functions
    .region("us-central1")
    .runWith({ memory: '2GB' })
    .pubsub.schedule("0 0 * * *")
    .timeZone("US/Pacific")
    .onRun(async () => {
        try {
            const scrapedData = await scraper.scrapeData();
            await db.collection('days').doc(getToday()).set(scrapedData);
        } catch (error) {
            throw new Error(error);
        } 
    })
