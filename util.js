function el(id) {
    return document.getElementById(id);
}

function val(id) {
    return parseFloat(el(id).value);
}

function checked(id) {
    return el(id).checked;
}
