const UNIT_FACT = {
    'km': 1.0,
    'mile': 1.609344,
    'meter': 0.001,
    'yard': 0.0009144,
    'foot': 0.0003048
}

class DistanceInput {
    constructor(distancefield, unitfield) {
        this.distancefield = distancefield;
        this.unitfield = unitfield;
        this._derived = false;
        this.value = distancefield.value;

        selectOnFocus(this.distancefield);
        onBlur(this.onUpdate.bind(this), this.distancefield);
        onClear(this.clear.bind(this), false, this.distancefield);
        this.unitfield.addEventListener('change', this.onUnitUpdate.bind(this));
    }

    get isEmpty() {
        return this.distancefield.value === '';
    }

    getDistanceInKm() {
        let distance = parseFloat(this.distancefield.value) || 0;
        return toKm(distance, this.unitfield.value);
    }

    set derived(value) {
        this._derived = value;
        if (value) {
            this.distancefield.classList.add('derived');
        } else {
            this.distancefield.classList.remove('derived');
        }
    }

    get derived() {
        return this._derived;
    }

    clear() {
        this.distancefield.value = '';
        recalculate();
    }

    onUpdate(event) {
        if (this._derived && this.distancefield.value !== this.value) {
            this.derived = false;
        }
        this.value = this.distancefield.value;
        recalculate();
    }

    onUnitUpdate(event) {
        recalculate();
    }

    calculate() {
        console.log("calculating distance")
        let timeInSeconds = timeInput.getTimeInSeconds();
        let paceInSecondsPerKm = paceInput.getPaceInSecondsPerKm();
        let distanceInKm = timeInSeconds / paceInSecondsPerKm;
        let distance = fromKm(distanceInKm, this.unitfield.value);
        this.distancefield.value = distance.toFixed(2);
        this.value = this.distancefield.value;
    }
}

class PaceInput {
    constructor(timefield, minutefield, secondfield, unitfield) {
        this.timefield = timefield; // the wrapper element
        // this.hourfield = hourfield;
        this.minutefield = minutefield;
        this.secondfield = secondfield;
        this.unitfield = unitfield;
        this._derived = false;
        this.value = `${this.minutefield.value}:${this.secondfield.value}`

        selectOnFocus(this.minutefield, this.secondfield);
        zeropad(this.minutefield, this.secondfield);
        parentFocus(this.timefield, this.minutefield, this.secondfield);
        onBlur(this.onUpdate.bind(this), this.minutefield, this.secondfield);
        onClear(this.clear.bind(this), true, this.minutefield, this.secondfield);
        this.unitfield.addEventListener('change', this.onUnitUpdate.bind(this));
    }

    get isEmpty() {
        return this.minutefield.value === '' && this.secondfield.value === '';
    }

    getPaceInSecondsPerKm() {
        let minutes = parseInt(this.minutefield.value) || 0;
        let seconds = parseInt(this.secondfield.value) || 0;
        let timeInSeconds = minutes * 60 + seconds;
        let distanceInKm = toKm(1, this.unitfield.value)
        return timeInSeconds / distanceInKm;
    }

    set derived(value) {
        this._derived = value;
        if (value) {
            this.timefield.classList.add('derived');
        } else {
            this.timefield.classList.remove('derived');
        }
    }

    get derived() {
        return this._derived;
    }

    clear() {
        this.minutefield.value = '';
        this.secondfield.value = '';
        recalculate();
    }

    onUpdate(event) {
        let newValue = `${this.minutefield.value}:${this.secondfield.value}`
        if (this._derived && newValue !== this.value) {
            this.derived = false;
        }
        this.value = newValue;
        // if new value is not empty, zet all other fields to zero
        if (event.target.value !== '') {
            for (let element of [this.minutefield, this.secondfield]) {
                if (element.value === '') {
                    element.value = '00';
                }
            }
        }

        recalculate();
    }

    onUnitUpdate(event) {
        recalculate();
    }

    calculate() {
        console.log("calculating pace")
        let time = timeInput.getTimeInSeconds();
        let distanceKm = distanceInput.getDistanceInKm();
        let distance = fromKm(distanceKm, this.unitfield.value)
        let pace = time / distance;
        let minutes = Math.floor(pace / 60);
        let seconds = Math.floor(pace - minutes * 60);
        this.minutefield.value = padZero(minutes, 2);
        this.secondfield.value = padZero(seconds, 2);
        this.value = `${this.minutefield.value}:${this.secondfield.value}`
    }
}

class TimeInput {
    constructor(timefield, hourfield, minutefield, secondfield) {
        this.timefield = timefield; // the wrapper element
        this.hourfield = hourfield;
        this.minutefield = minutefield;
        this.secondfield = secondfield;
        this._derived = false;
        this.value = `${this.hourfield.value}:${this.minutefield.value}:${this.secondfield.value}`

        selectOnFocus(this.hourfield, this.minutefield, this.secondfield);
        zeropad(this.hourfield, this.minutefield, this.secondfield);
        parentFocus(this.timefield, this.hourfield, this.minutefield, this.secondfield);
        onBlur(this.onUpdate.bind(this), this.hourfield, this.minutefield, this.secondfield);
        onClear(this.clear.bind(this), true, this.hourfield, this.minutefield, this.secondfield);
    }

    get isEmpty() {
        return this.hourfield.value === '' && this.minutefield.value === '' && this.secondfield.value === '';
    }

    getTimeInSeconds() {
        let hours = parseInt(this.hourfield.value) || 0;
        let minutes = parseInt(this.minutefield.value) || 0;
        let seconds = parseInt(this.secondfield.value) || 0;
        return hours * 3600 + minutes * 60 + seconds;
    }

    set derived(value) {
        this._derived = value;
        if (value) {
            this.timefield.classList.add('derived');
        } else {
            this.timefield.classList.remove('derived');
        }
    }

    get derived() {
        return this._derived;
    }

    clear() {
        this.hourfield.value = '';
        this.minutefield.value = '';
        this.secondfield.value = '';
        recalculate();
    }

    onUpdate(event) {
        let newValue = `${this.hourfield.value}:${this.minutefield.value}:${this.secondfield.value}`
        if (this._derived && newValue !== this.value) {
            this.derived = false;
        }
        this.value = newValue;
        // if new value is not empty, zet all other fields to zero
        if (event.target.value !== '') {
            for (let element of [this.hourfield, this.minutefield, this.secondfield]) {
                if (element.value === '') {
                    element.value = '00';
                }
            }
        }

        recalculate();
    }

    calculate() {
        console.log("calculating time")
        let pace = paceInput.getPaceInSecondsPerKm();
        let distanceKm = distanceInput.getDistanceInKm();
        let time = pace * distanceKm;
        let hours = Math.floor(time / 3600);
        let minutes = Math.floor((time - hours * 3600) / 60);
        let seconds = Math.floor(time - hours * 3600 - minutes * 60);
        this.hourfield.value = padZero(hours, 2)
        this.minutefield.value = padZero(minutes, 2);
        this.secondfield.value = padZero(seconds, 2);
        this.value = `${this.hourfield.value}:${this.minutefield.value}:${this.secondfield.value}`
    }
}

// Add and removes focus class to parent element if one of the child elements has focus
function parentFocus(parent, ...elements) {
    for (let element of elements) {
        element.addEventListener('focus', function () {
            parent.classList.add('focus');
        });
        element.addEventListener('blur', function () {
            parent.classList.remove('focus');
        });
    }
}

function onBlur(fn, ...elements) {
    for (let element of elements) {
        element.addEventListener('blur', fn);
    }
}

function onClear(fn, includeDot, ...elements) {
    for (let element of elements) {
        element.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' || event.key === '-' || includeDot && event.key === '.') {
                fn(event);
                element.blur();
            }
        });
        element.addEventListener('keypress', function (event) {
            if (event.key === '-' || includeDot && event.key === '.') {
                event.preventDefault();
            }
        });

        // // It looks like this is needed for mobile devices
        // element.addEventListener('input', function (event) {
        //     if (element.value.includes('-') || includeDot && element.value.includes('.')) {
        //         console.log(`replacing`)
        //         element.value = element.value.replace('-', '').replace('.', '');
        //         event.preventDefault();
        //         fn(event);
        //         element.blur();
        //     }
        // });
    }
}

function selectOnFocus(...elements) {
    for (let element of elements) {
        element.addEventListener('focus', function () {
            element.select();
        });
    }
}

function zeropad(...elements) {
    for (let element of elements) {
        element.addEventListener('blur', function () {
            if (element.value !== '') {
                element.value = padZero(element.value, 2);
            }
        });
    }
}

function padZero(value, digits) {
    return value.toString().padStart(digits, '0');
}

const timeInput = new TimeInput(
    document.getElementById('race_time'),
    document.getElementById('time_hours'),
    document.getElementById('time_minutes'),
    document.getElementById('time_seconds'));
const paceInput = new PaceInput(
    document.getElementById('pace_time'),
    document.getElementById('pace_minutes'),
    document.getElementById('pace_seconds'),
    document.getElementById('pace_unit'));
const distanceInput = new DistanceInput(
    document.getElementById('distance'),
    document.getElementById('distance_unit'));

const INPUTS = [timeInput, paceInput, distanceInput];

function recalculate() {
    let derivedInput = getDerivedInput();
    if (derivedInput) {
        // If there is a non-derived input empty, clear derived flag
        let nonDerivedEmptyInputs = INPUTS.filter(input => !input.derived && input.isEmpty);
        if (nonDerivedEmptyInputs.length > 0) {
            console.log(`Clearing derived flag for ${derivedInput.constructor.name}`);
            derivedInput.derived = false;
            derivedInput = null;
        }
    }

    if (derivedInput === null) {
        // If there is a single empty input, make it the derived input
        let emptyInputs = INPUTS.filter(input => input.isEmpty);
        if (emptyInputs.length === 1) {
            emptyInputs[0].derived = true;
        }
    }

    derivedInput = getDerivedInput();
    if (derivedInput !== null) {
        derivedInput.calculate();
    }
}

function getDerivedInput() {
    for (let input of INPUTS) {
        if (input.derived) {
            return input;
        }
    }
    return null;
}

function toKm(distance, unit) {
    return distance * UNIT_FACT[unit];
}

function fromKm(distance, unit) {
    return distance / UNIT_FACT[unit];
}
