let p1 = document.getElementById('Sw1')
let p2 = document.getElementById('Sw2')
let swState = 1

function sw(i){
    if(i = 1){
        p1.classList.add('swActive')
        p2.classList.remove('swActive')
    } if(i == 2) {
        p2.classList.add('swActive')
        p1.classList.remove('swActive')
    }
}

