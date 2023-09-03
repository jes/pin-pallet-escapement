function el(id) {
    return document.getElementById(id);
}

function txt(id, s) {
    el(id).innerText = s;
}

function val(id) {
    return parseFloat(el(id).value);
}

function checked(id) {
    return el(id).checked;
}

function sigfigs(v, sf) {
    if (v < 0) {
        return "-" + sigfigs(-v, sf);
    }

    if (v == 0) {
        // toPrecision is 1 short of decimal places when v==0, so add an extra one
        return v.toPrecision(sf) + '0';
    }

    if (!v.toPrecision(sf).includes('e')) {
        // use toPrecision when it does not produce scientific notation
        return v.toPrecision(sf);
    }

    // for numbers larger than 1, divide by 10^N and add N trailing zeroes
    if (v > 1) {
        let extra = '0';
        v /= 10;
        while (v.toPrecision(sf).includes('e')) {
            extra += '0';
            v /= 10;
        }
        return v.toPrecision(sf) + extra;
    }

    // for numbers smaller than 1, multiply by 10^N and add N leading zeroes after the decimal place
    let extra = '0.0';
    v *= 10;
    while (v.toPrecision(sf).includes('e')) {
        extra += '0';
        v *= 10;
    }
    return extra + v.toPrecision(sf).substr(2);
}
