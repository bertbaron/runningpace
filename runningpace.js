const UNIT_FACT = {
    'km': 1.0,
    'mile': 1.609344,
    'meter': 0.001,
    'yard': 0.0009144,
    'foot': 0.0003048,
    'marathon': 42.195
}

class Input {
    constructor(...inputFields) {
        this.inputFields = inputFields;
        this._derived = false;
    }

    set derived(value) {
        this._derived = value;
        for (let inputField of this.inputFields) {
            if (value) {
                inputField.classList.add('derived');
            } else {
                inputField.classList.remove('derived');
            }
        }
    }

    get derived() {
        return this._derived;
    }
}

class DistanceInput extends Input {
    constructor(distancefield, unitfield) {
        super(distancefield);
        this.distancefield = distancefield;
        this.unitfield = unitfield;
        this._derived = false;
        this.value = distancefield.value;

        selectOnFocus(this.distancefield);
        configureInput(this, this.distancefield);
        this.unitfield.addEventListener('change', this.onUnitUpdate.bind(this));
    }

    get isEmpty() {
        return this.distancefield.value === '';
    }

    getDistanceInKm() {
        let distance = parseFloat(this.distancefield.value) || 0;
        return toKm(distance, this.unitfield.value);
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
        let timeInSeconds = timeInput.getTimeInSeconds();
        let paceInSecondsPerKm = paceInput.getPaceInSecondsPerKm();
        let distanceInKm = timeInSeconds / paceInSecondsPerKm;
        let distance = fromKm(distanceInKm, this.unitfield.value);
        this.distancefield.value = distance.toFixed(2).replace(/\.?0+$/, '');
        this.value = this.distancefield.value;
    }
}

class PaceInput extends Input {
    constructor(label, timefield, minutefield, secondfield, speedfield, unitfield) {
        super(timefield, speedfield);
        this.label = label;
        this.speedmode = false;
        this.timefield = timefield; // the wrapper element
        this.minutefield = minutefield;
        this.secondfield = secondfield;
        this.speedfield = speedfield;
        this.unitfield = unitfield;
        this._derived = false;
        this.value = this.valueString();

        configureTimeFields(this.timefield, this.minutefield, this.secondfield);
        configureInput(this, this.timefield, this.minutefield, this.secondfield, this.speedfield);
        this.unitfield.addEventListener('change', this.onUnitUpdate.bind(this));
    }

    get isEmpty() {
        return this.minutefield.value === '' && this.secondfield.value === '';
    }

    getPaceInSecondsPerKm() {
        if (this.speedmode) {
            let speed = parseFloat(this.speedfield.value) || 0;
            let speedKmh = toKmh(speed, this.unitfield.value);
            return 3600 / speedKmh;
        } else {
            let minutes = parseInt(this.minutefield.value) || 0;
            let seconds = parseInt(this.secondfield.value) || 0;
            let timeInSeconds = minutes * 60 + seconds;
            let distanceInKm = toKm(1, this.unitfield.value)
            return timeInSeconds / distanceInKm;
        }
    }

    clear() {
        this.minutefield.value = '';
        this.secondfield.value = '';
        recalculate();
    }

    onUpdate(event) {
        let newValue = this.valueString();
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
        let unit = event.target.value;
        let newSpeedMode = !(unit in UNIT_FACT);
        if (newSpeedMode !== this.speedmode) {
            if (newSpeedMode) {
                this.timefield.classList.add('hidden');
                this.speedfield.classList.remove('hidden');
                this.speedfield.hidden = false;
                this.label.textContent = 'Speed';
                if (!this.derived) {
                    this.speedfield.value = '';
                    // TODO convert current pace to speed (requires remembering previous unit)
                }
            } else {
                this.timefield.classList.remove('hidden');
                this.speedfield.classList.add('hidden');
                this.label.textContent = 'Pace';
                if (!this.derived) {
                    // TODO convert current speed to pace (requires remembering previous unit)
                    this.minutefield.value = '';
                    this.secondfield.value = '';
                }
            }
            this.speedmode = newSpeedMode;
        }
        recalculate();
    }

    calculate() {
        let time = timeInput.getTimeInSeconds();
        let distanceKm = distanceInput.getDistanceInKm();
        if (this.speedmode) {
            let speed = distanceKm / time * 3600;
            speed /= UNIT_FACT[distanceUnit(this.unitfield.value)];
            this.speedfield.value = speed.toFixed(2).replace(/\.?0+$/, '');
        } else {
            let distance = fromKm(distanceKm, this.unitfield.value)
            let pace = time / distance;
            let minutes = Math.floor(pace / 60);
            let seconds = Math.floor(pace - minutes * 60);
            this.minutefield.value = padZero(minutes, 2);
            this.secondfield.value = padZero(seconds, 2);
        }
        this.value = this.valueString();
    }

    valueString() {
        return this.speedmode ? this.speedfield.value : `${this.minutefield.value}:${this.secondfield.value}`
    }
}

class TimeInput extends Input {
    constructor(timefield, hourfield, minutefield, secondfield) {
        super(timefield);
        this.timefield = timefield; // the wrapper element
        this.hourfield = hourfield;
        this.minutefield = minutefield;
        this.secondfield = secondfield;
        this._derived = false;
        this.value = `${this.hourfield.value}:${this.minutefield.value}:${this.secondfield.value}`

        configureTimeFields(this.timefield, this.hourfield, this.minutefield, this.secondfield);
        configureInput(this, this.timefield, this.hourfield, this.minutefield, this.secondfield);
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

function configureTimeFields(parentField, ...fields) {
    selectOnFocus(...fields);
    zeropad(...fields);
    parentFocus(parentField, ...fields);

    // clean up input and move focus to next field if ':' is entered
    for (let i = 0; i < fields.length; i++) {
        const element = fields[i];
        const nextElement = i < fields.length - 1 ? fields[i + 1] : null;
        element.addEventListener('input', function (event) {
            let moveFocus = false;
            if (nextElement && element.value.includes(':')) {
                moveFocus = true;
            }
            element.value = element.value.replace(/\D/g, '');
            while (parseInt(element.value) > 60) {
                element.value = element.value.slice(0, -1);
            }

            if (moveFocus) {
                element.blur();
                nextElement.focus();
            }
        });
    }
}

function configureInput(input, ...fields) {
    onInput(input.onUpdate.bind(input), ...fields);
    onClear(input.clear.bind(input), ...fields);
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

function onInput(fn, ...elements) {
    for (let element of elements) {
        element.addEventListener('input', fn);
    }
}

let longPressTimeout;
let longPressed = false;
let releaseTimestamp;

function onClear(fn, ...elements) {
    for (let element of elements) {
        element.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                fn(event);
                element.blur();
            }
        });
        for (let eventType of ['mousedown', 'touchstart']) {
            element.addEventListener(eventType, function (event) {
                // console.log(`event: ${eventType} on ${event.target.id}, setting timeout`)
                clearTimeout(longPressTimeout) // for robustness
                longPressTimeout = setTimeout(function () {
                    fn(event);
                    event.stopPropagation();
                    // console.log(`long-press timeout, blurring`)
                    element.blur();
                    longPressed = true;
                }, 500);
            });
        }
        for (let eventType of ['mouseup', 'touchend', 'mouseleave', 'touchcancel']) {
            element.addEventListener(eventType, function (event) {
                // console.log(`event: ${eventType} @ ${event.timeStamp}`)
                if (longPressed) {
                    element.blur();
                    event.stopPropagation();
                    event.preventDefault();
                    element.blur();
                    longPressed = false;
                    releaseTimestamp = event.timeStamp;
                }
                clearTimeout(longPressTimeout);
            });
        }
        element.addEventListener('click', function (event) {
            // console.log(`event: click @ ${event.timeStamp}`)
            if (event.timeStamp === releaseTimestamp) {
                event.preventDefault();
                element.blur();
            }
        });
    }
}

function selectOnFocus(...elements) {
    for (let element of elements) {
        element.addEventListener('focus', function (event) {
            element.select();
        });
        element.addEventListener('contextmenu', function (event) {
            event.preventDefault();
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
    document.getElementById('pacelabel'),
    document.getElementById('pace_time'),
    document.getElementById('pace_minutes'),
    document.getElementById('pace_seconds'),
    document.getElementById('speed'),
    document.getElementById('pace_unit'));
const distanceInput = new DistanceInput(
    document.getElementById('distance'),
    document.getElementById('distance_unit'));
const invisibleFocusCatcher = document.getElementById('invisibleFocusCatcher');

const INPUTS = [timeInput, paceInput, distanceInput];

function recalculate() {
    let derivedInput = getDerivedInput();
    if (derivedInput) {
        // If there is a non-derived input empty, clear derived flag
        let nonDerivedEmptyInputs = INPUTS.filter(input => !input.derived && input.isEmpty);
        if (nonDerivedEmptyInputs.length > 0) {
            // console.log(`Clearing derived flag for ${derivedInput.constructor.name}`);
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
    return distance * UNIT_FACT[distanceUnit(unit)];
}

function fromKm(distance, unit) {
    return distance / UNIT_FACT[distanceUnit(unit)];
}

function toKmh(speed, unit) {
    return speed * UNIT_FACT[distanceUnit(unit)];
}

function fromKmh(speed, unit) {
    return speed / UNIT_FACT[distanceUnit(unit)];
}

function distanceUnit(unit) {
    if (unit.includes('/')) {
        return unit.split('/')[0];
    }
    return unit;
}

// Prevent keyboard from popping up on mobile
invisibleFocusCatcher.addEventListener('focus', function () {
    invisibleFocusCatcher.readOnly = true;
});
invisibleFocusCatcher.addEventListener('blur', function () {
    invisibleFocusCatcher.readOnly = false;
});