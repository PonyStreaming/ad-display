const AD_SCREEN_TIME_MS = 20000;
const AD_LIST_REFRESH_TIME_MS = 600000;
const AD_BUCKET = "https://ponyfest-ads.nyc3.digitaloceanspaces.com/";

let adList = [];
let adPointer = 0;
let updateInterval = 0;
let nextImage = null;
let usingOverlayImage = false;

async function updateAdList() {
    adList = Array.from((new DOMParser()).parseFromString(await (await fetch(AD_BUCKET)).text(), "text/xml").getElementsByTagName('Key')).map(x => x.textContent);
    if (adPointer >= adList.length) {
        adPointer = 0;
        console.warn("Resetting ad pointer to start: it pointed past the end of the new adList");
    }
}

function showNextAd() {
    if (usingOverlayImage) {
        document.getElementById("ad-image").src = AD_BUCKET + adList[adPointer];
        document.getElementById('ad-image-2').style.opacity = '0';
    } else {
        document.getElementById("ad-image-2").src = AD_BUCKET + adList[adPointer];
        document.getElementById('ad-image-2').style.opacity = '1';
    }
    usingOverlayImage = !usingOverlayImage;
    adPointer = (adPointer + 1) % adList.length;
    nextImage = new Image();
    nextImage.src =  AD_BUCKET + adList[adPointer];
}

function cancelAd() {
    adPointer--;
    if (adPointer < 0) {
        adPointer = adList.length;
    }
    clearInterval(updateInterval);
}

async function initialise() {
    await updateAdList();
    showNextAd();
    setInterval(updateAdList, AD_LIST_REFRESH_TIME_MS);
    if (!window.obsstudio) {
        console.log("Not running in OBS; proceeding blindly.");
        updateInterval = setInterval(showNextAd, AD_SCREEN_TIME_MS);
        showNextAd();
    } else {
        console.log("Waiting to hear that we're active...");
    }
}

if (window.obsstudio) {
    window.obsstudio.onActiveChange = (active) => {
        if (active) {
            updateInterval = setInterval(showNextAd, AD_SCREEN_TIME_MS);
        } else {
            cancelAd();
        }
    };
}

initialise();
