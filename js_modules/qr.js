// import { cycleQRWrap, toggleShowQR } from './js/qr.js'

const noQueryUrl = window.location.href.split('?')[0];
console.log(noQueryUrl); 

let startQRsize = 1;
let showQR = 0;

export function cycleQRSize(n) {
    if (n) {
        startQRsize = n;
    } else {
        if (startQRsize < 3) {
            startQRsize++
        } else {
            startQRsize = 1
        }
    }

    switch (startQRsize) {
        case 1:
            qrImg.style.width = "min(25vh, 25vw)"
            break;
        case 2:
            qrImg.style.width = "min(33vh, 33vw)"
            break;
        case 3:
            qrImg.style.width = "min(50vh, 50vw)"
            break;
    }
}

export function cycleQRWrap() {
    return cycleQRSize()
}

export function genNewQR(url, elem) {
    // const thisQR = new QRCode(elem, {
    //     text: url,
    //     colorDark: "#000000",
    //     colorLight: "#fffffff",
    //     margin: 2,
    // })

    const qrImg = elem.querySelector('#qrImg')
    const qrURL = elem.querySelector('#urlDisplay')
    
    QRCode.toDataURL(url).then(dataURL => {
        
        qrImg.src = dataURL;
    })

    const qrAnchor = document.createElement('a')
    qrAnchor.href = url
    qrAnchor.innerText = url
    
    qrURL.innerHTML = ''
    qrURL.append(qrAnchor)
}

export function toggleShowQR() {
    if (showQR == 0) {
        showQR = 1;
        viewQR.classList.add('show');
    } else {
        showQR = 0;
        // cycleQRSize(1);
        viewQR.classList.remove('show');
    }
}

export function genQRstr(dataDict) {
    
    let urlStr = noQueryUrl
    const keysArr = Object.keys(dataDict)

    if (keysArr.length > 0) {
        urlStr += "?"
        
        for (let i = 0; i < keysArr.length; i++) {
            const onset = keysArr[i];
            const coda = dataDict[keysArr[i]];

            urlStr += onset + "=" + coda;
            
            if (i < keysArr.length - 1) {
                urlStr += "&";
            }
        }
    }


    console.log(urlStr);
    return urlStr;
}
