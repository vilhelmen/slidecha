
// does this map make my state look big?
//  also idk what this type is oh no help
const uiState = {
    global: 'info', // info -> start -> load -> play -> (start/fail(/reset?)) -> (load/exit)
    quit: 'start', // start, off, waiting
    reset: 'off', // off, waiting
    info: true,
    do_flip: false,
    puzzleid: 0,
    progress_update: true,
    humanity: 50,
    tile_time: 0.1,
    active_tile: [],
    clicked_tile: []
};

let frameScheduled = false;
function scheduleRender() {
    if (!frameScheduled) {
        frameScheduled = true;
        requestAnimationFrame(renderQueue);
    }
}

function renderQueue() {
    // calling all of them every time I need a frame hurts me. It hurts.
    //  I don't want to be part of the problem!!!

    // if it's at the top, we can render more than needed.
    //  if it's at the bottom, we can render less than needed.
    frameScheduled = false;
    renderInfo();
    quitRender();
    resetRender();
    flipRender();
    progressRender();
    slideRender();
    puzzleRender();
}

function quitRender() {
    const quit_button = document.getElementById('control-7');
    const quit_slider = document.getElementById('quit-confirm');
    const span = quit_slider.getElementsByTagName('span')[0];
    const svg = quit_button.querySelector('svg use');
    // no I'm not checking my variables, if my buttons fell off the page I can't help you.

    switch (uiState.quit) {
        // we just reuse the reset state for click eater
        case 'start':
            quit_button.classList.add('start');
            quit_slider.classList.add('start');
            if (uiState.puzzleid === 0) {
                span.innerText = 'Click to begin';
            } else {
                span.innerText = 'Next';
            }
            // svg.setAttribute('xlink:href', 'bootstrap-icons.svg#play');
            if (uiState.global !== 'info') {
                quit_button.classList.add('active');
                quit_slider.classList.add('active');
                clickEater.classList.add('active', 'reset');
            }
            break;
        case 'off':
            quit_button.classList.remove('active', 'start');
            quit_slider.classList.remove('active', 'start');
            clickEater.classList.remove('reset')
            // FIXME: this will immediately reset on first click, need intermediary state?
            quit_slider.firstElementChild.innerText = 'New puzzle?';
            break;
        case 'waiting':
            quit_button.classList.add('active');
            quit_slider.classList.add('active');
            clickEater.classList.add('active', 'reset');
            // TECHNICALLY... a violation of the state machine could end us here
            // svg.setAttribute('xlink:href', 'bootstrap-icons.svg#eject');
            break;
    }
}

function register_quit() {
    const quit_button = document.getElementById('control-7');

    quit_button.addEventListener('click', (event) => {
        event.stopPropagation(); // ?? who else could have this event
        switch (uiState.quit) {
            case 'start':
                // TODO: game start, wreck up the place
                uiState.quit = 'off';
                // TODO: (semi-)fake loading/generation screen
                uiState.global = 'load';
                //ready_puzzle();
                break;
            case 'off':
                uiState.quit = 'waiting';
                break;
            case 'waiting':
                // requested new puzzle, wreck up the place or get annoying
                // TODO: reset/nag hook
                uiState.quit = 'off';
        }
        scheduleRender();
    });

    clickEater.addEventListener('click', (event) => {
        event.stopPropagation(); // the click can fall through?? this doesn't seem right at all tbh.
        // clicked somewhere else
        if (uiState.quit === 'waiting') {
            uiState.quit = 'off';
            scheduleRender();
        }
    });
}

function resetRender() {
    const reset_button = document.getElementById('control-3');
    const reset_slider = document.getElementById('reset-confirm');
    const svg = reset_button.querySelector('svg use');
    // no I'm not checking my variables, if my buttons fell off the page I can't help you.

    switch (uiState.reset) {
        case 'off':
            reset_button.classList.remove('active');
            reset_slider.classList.remove('active');
            break;
        case 'waiting':
            reset_button.classList.add('active');
            reset_slider.classList.add('active');
            clickEater.classList.add('active', 'reset');
            break;
    }
}

function register_reset() {
    const reset_button = document.getElementById('control-3');

    reset_button.addEventListener('click', (event) => {
        event.stopPropagation(); // ?? who else could have this event
        switch (uiState.reset) {
            case 'off':
                uiState.reset = 'waiting';
                break;
            case 'waiting':
                // TODO: reset state handler
                uiState.reset = 'off';
                break;
        }
        scheduleRender();
    });

    clickEater.addEventListener('click', (event) => {
        // event.stopPropagation(); // the click can fall through?? this doesn't seem right at all tbh.
        // actually that seems bad I have like 5 listeners for this object.

        // clicked somewhere else
        if (uiState.reset === 'waiting') {
            uiState.reset = 'off';
            scheduleRender();
        }
    });
}

function flipRender() {
    // no, I will not be naming these consistently, thank you.
    if (uiState.do_flip) {
        const flip_button = document.getElementById('control-9');
        const svg_element = flip_button.getElementsByTagName('svg')[0];

        const dyn_left = document.getElementById('dynamic-top-left');
        const puzzle_holder = document.getElementById('puzzle-holder');
        const dyn_right = document.getElementById('dynamic-top-right');
        const solution_holder = document.getElementById('solution-holder');

        const soln_id = solution_holder.getElementsByClassName('container-id')[0];
        const puzzle_id = puzzle_holder.getElementsByClassName('container-id')[0];

        soln_id.style.animation = 'none';
        puzzle_id.style.animation = 'none';
        void soln_id.offsetHeight; // this forces things to recalculate so the animation reapplies
        void puzzle_id.offsetHeight;
        soln_id.style.animation = 'var(--id-flash-animation-params)';
        puzzle_id.style.animation = 'var(--id-flash-animation-params)';

        if (!flip_button.classList.contains('active')) {
            dyn_left.appendChild(solution_holder);
            dyn_right.appendChild(puzzle_holder);
            flip_button.classList.add('active');
        } else {
            dyn_left.appendChild(puzzle_holder);
            dyn_right.appendChild(solution_holder);
            flip_button.classList.remove('active');
        }
        uiState.do_flip = false;
    }
}

function register_flipper() {
    const flip_button = document.getElementById('control-9');
    flip_button.addEventListener('click', (event) => {
        event.stopPropagation(); // ??
        uiState.do_flip = true;
        scheduleRender();
    });
}


function puzzleRender() {
    if (uiState.global === 'load') {
        // actually crunch the puzzle, then do fake loading
    }
    if (uiState.clicked_tile.length !== 0) {
        // highlight/lowlight
    }
}


/**
 * Construct puzzle initial state
 * @param {number} size - puzzle size, NxN
 * @param {number} shifts - Number of row/column shifts (min solution moves is (generally) between [shifts] and [floor(size/2)*shifts] )
 * @param {number} shuffle - shuffle pieces. A single swap can easily make it "impossible"
 */
function plan_puzz(size = 3, shifts= 4, shuffle = 0) {
    // Technically the minimum solution length could be lower as we are SUPER NOT tracking higher order move effects.
    //  also we could, theoretically, immediately undo a move

    // I'm trusting your input, do NOT tell my students
    const grid = []; // UHHH this traversal makes it... and upside down N
    for (let i = 0; i < size; i++) {
        grid[i] = [];
        for (let j = 0; j < size; j++) {
            grid[i][j] = j + (size*i);
        }
    }
    // the trick is to start with the solution and then screw it all up
    let vert; // vertical/horizontal
    let position; // row/column idx
    let code;
    const move_hist = [], max_hist = size-1;
    let magnitude; // how far to shift
    // actually, we need to track our moves because of wrap around
    let actual_moves = 0;
    const rollover = Math.floor(size/2); // said wrap around

    for (let i = 0; i < shifts; i++) {
        // What is going on with the RNG I refuse to believe it's acting right
        //  Back of the envelope 6 options B2B that's 1/6 1/6 and that's 2.7%
        //  Do you know how often I'm seeing duplicates TWICE? That's less than 0.5% or WORSE or also I can't do math anymore
        //   What is wrong with web developers? WHat is wrong with my IDE? Why are we still here? Just to suffer?
        // GET PUNISHED, MOVES ARE WINDOWED UNIQUE NOW.
        //  (um actually it would be ok to repeat so long as there was a perpendicular move pre-repeat)
        do {
            vert = Math.random() < 0.5; // vert or horz
            position = getRandomInt(size);
            code = position + '|' + vert; // lol t/f becoming 1/0 and screwing it up glad I checked, get stringed, loser
        } while (move_hist.includes(code));
        // OH MY GOD NOW IT'S GENERATED THE SAME PAIR OF MOVES GEORGE IS GETTING UPSET

        if (move_hist.length > max_hist) {
            move_hist.shift()
        }
        move_hist.push(code)

        // it's modular so there's a max of size-1 moves, but also we don't want 0 moves, so -1 +1
        magnitude = getRandomInt(size - 1) + 1
        //console.log(code, magnitude)

        // Like I mentioned, wrap around, so if it's past the center the technical solution goes the other way
        if (magnitude <= rollover) {
            actual_moves += magnitude
        } else {
            actual_moves += magnitude - rollover
        }

        // Are our moves sufficiently distributed if we skip the opposite direction?
        //  We cut off the symmetric part so... yes? Ignoring things that approach analyzing the underlying known-bad RNG
        if (vert) {
            // that's... columns
            column_shift(grid, position, magnitude)
        } else {
            // the other one :)
            row_shift(grid, position, magnitude)
        }
    }

    const total = size * size;
    for (let i = 0; i < shuffle; i++) {
        const a = getRandomInt(total), b = getRandomInt(total);
        const a_row = Math.floor(a / total), a_col = a % size;
        const b_row = Math.floor(b / total), b_col = b % size;
        const tmp = grid[a_row][a_col];
        grid[a_row][a_col] = grid[b_row][b_col];
        grid[b_row][b_col] = tmp;
    }

    const position_map = new Map()
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            // grid position x -> tile number y
            position_map.set(j + (size*i), grid[i][j]);
        }
    }
    // ... actually I need this inverted to load the grid easier
    // const inv_map = new Map([...position_map].map(([k, v]) => [v, k]));

    return [grid, actual_moves, position_map];
}

// ty MDN, I'm sorry Mozilla keeps making terrible business decisions
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

/**
 * Shift a grid row
 * @param {Array<Array<number>>} grid - The grid to shift
 * @param {number} idx - the column index to shift
 * @param {number} magnitude - how much to shift
 * @param {boolean} left - shift left instead of right
 */
function row_shift(grid, idx, magnitude, left = false) {
    // I am not checking magnitude < size, what am I going to do if it's wrong anyway
    // this is the easy one. My kingdom for better slicing
    for (let i = 0; i < magnitude; i++) {
        if (left) {
            grid[idx].push(grid[idx].shift())
        } else {
            grid[idx].unshift(grid[idx].pop())
        }
    }
}


/**
 * Shift a grid column
 * @param {Array<Array<number>>} grid - The grid ot shift
 * @param {number} idx - the column index to shift
 * @param {number} magnitude - how much to shift
 * @param {boolean} up - shift up instead of down
 */
function column_shift(grid, idx, magnitude, up= false) {
    // I am not checking magnitude < size, what am I going to do if it's wrong anyway

    // I'm not too proud to admit Gemini told me this (but I am ashamed), it's a smart trick. Googling failed me
    // Big brain am winning again, if I make it a 2d with one row I can offload to row_shift, take THAT gemini.
    const tmprow = [[]]
    for (let i = 0; i < grid.length; i++) {
        tmprow[0].push(grid[i][idx]);
    }
    // UHHHHHH we collected them going down sooooo... a shift left is a shift up, handy!
    row_shift(tmprow, 0, magnitude, up)

    // now just put them back
    for (let i = 0; i < grid.length; i++) {
        grid[i][idx] = tmprow[0][i]
    }
}


// ALRIGHT. We need to:
// 1. generate the puzzle. This is easy. Tragically I've already finished it (probably)
// 2. Figure out ~art~ modes and gen HTML/CSS for slots. Image, symbols+colors, hell modes.
// 3. Dump to play area
// 4. Start play loop, activate further hell settings

const colors = new Map([
    // I am good with names!!!
    // https://coolors.co/palette/2f3e77-f5b841-f4ece3-2cb67d-ff4f5e-4ac6ff-ff6a3d
    ['default', ['#2f3e77','#f5b841','#f4ece3','#2cb67d','#ff4f5e','#4ac6ff','#ff6a3d']],
    // another I like https://coolors.co/palette/f94144-f3722c-f8961e-f9844a-f9c74f-90be6d-43aa8b-4d908e-577590-277da1
    // But I don't care for the 4th and I think the 8 and 9 are too similar to 7 and 10
    //  but I don't like how unbalanced it is if I remove all three
    ['another_one', ['#f94144', '#f3722c', '#f8961e', '#f9844a', '#f9c74f', '#90be6d', '#43aa8b', '#4d908e', '#577590', '#277da1']],
    // https://coolors.co/palette/001219-005f73-0a9396-94d2bd-e9d8a6-ee9b00-ca6702-bb3e03-ae2012-9b2226
    //  the reds on the end are too similar imho
    ['another_two', ['#001219','#005f73','#0a9396','#94d2bd','#e9d8a6','#ee9b00','#ca6702','#bb3e03','#ae2012','#9b2226']],
    // https://coolors.co/palette/8ecae6-219ebc-023047-ffb703-fb8500
    // ...is this bluey? also too small
    ['bluey??', ['#8ecae6','#219ebc','#023047','#ffb703','#fb8500']],
    // https://coolors.co/palette/ef476f-ffd166-06d6a0-118ab2-073b4c
    // too small
    ['another_three', ["#ef476f","#ffd166","#06d6a0","#118ab2","#073b4c"]]
    // TODO: find more I like :)
])

// whitelist of the symbol set to narrow it down
//  also you're gonna want them to not by radially symmetric in any way for certain hell modes
//  ... or maybe you do

// require the puzzle to contain these in some form
//  alt mode to force only from this set
const symbols = new Map([
    // like and subscribe
    ['subscribe', ['youtube', 'hand-thumbs-up', 'sunglasses', 'twitch']],
    // chicken paul
    ['paul', ['egg', 'fire', 'egg-fried']],
    // "go to the bank and withdraw the funds" - conveniently the size of a 3x3
    //  I like chat-left-text but I feel headset is more appropriate. No office phone icon, tragically.
    ['withdrawfunds', ['headset', 'car-front', 'bank', 'person-vcard', 'credit-card-2-back',
        'cash-coin', 'currency-exchange', 'currency-bitcoin']],
    // MyCoin is a very real, award-winning financial establishment I'll have you know
    //  VERY tempted to add more copies of award to bias selection
    ['mycoin', ['currency-exchange', 'cash-coin', 'safe', 'briefcase',
        'currency-bitcoin', 'currency-euro', 'currency-dollar', 'currency-yen', 'currency-rupee', 'currency-pound',
        'buildings', 'bank', 'calculator', 'graph-up-arrow', 'award', 'headset']],
    // Emojos
    ['emojis', ['emoji-grin', 'emoji-astonished', 'emoji-grimace', 'emoji-smile-upside-down',
        'emoji-wink', 'emoji-kiss', 'emoji-neutral', 'emoji-expressionless', 'emoji-tear', 'emoji-dizzy', 'emoji-frown',
        'emoji-surprise', 'emoji-smile', 'emoji-heart-eyes', 'emoji-laughing', 'emoji-sunglasses', 'emoji-angry']],
    // Dice
    ['dice', ['dice-1', 'dice-2', 'dice-3', 'dice-4', 'dice-5', 'dice-6']],
    // Default whitelist from the set.
    // TODO: do
    ['default', []]
]);

/*
NOTE FROM BOOTSTRAP
<svg class="bi" width="32" height="32" fill="currentColor">
  <use xlink:href="bootstrap-icons.svg#heart-fill"/>
</svg>
<svg class="bi" width="32" height="32" fill="currentColor">
  <use xlink:href="bootstrap-icons.svg#toggles"/>
</svg>
<svg class="bi" width="32" height="32" fill="currentColor">
  <use xlink:href="bootstrap-icons.svg#shop"/>
</svg>
 */

function color_to_rgb(color_code) {
    const color = parseInt(color_code.slice(1), 16);
    return [color & 0xFF, (color & 0xFF00) >> 8, (color & 0xFF0000) >> 16]
}

function color_is_dark(color_code) {
    // pls I just want a color type.
    const [r, g, b] = color_to_rgb(color_code);
    return (r + g + b) / 3 < 128
}


function invert_style_color(color_string) {
    // ...colors coming out of .style are rgb(a??)()
    const parts = color_string.match(/\d+/g); // Extracts numbers
    if (!parts || parts.length !== 3) {
        console.warn("Invalid RGB color string:", color_string);
        return "black"; // Fallback color
    }

    return `rgb(${255 - parseInt(parts[0])}, ${255 - parseInt(parts[1])}, ${255 - parseInt(parts[2])})`;
}

function get_nonce(len) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let nonce = '';
    for (let i = 0; i < len; i++) {
        nonce += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    // swear to god if this generates duplicate strings I will riot
    return nonce;
}

let size = 5;
let steps = 4;
let shuffle = 0;



/**
 * Plan puzzle content. Image puzzle will disable all other content settings.
 *
 * Number of steps is not the number of moves to solution; generation MAY undo its own steps or create something reducible.
 * Maximum number of moves to solution is floor(size/2)*shifts
 *
 * !! BAD TIME POTENTIAL !!
 * - Shuffling even one piece will ruin the expected solution move total.
 *      Shuffling a piece can ruin traditional sliding puzzles, but this is modified to move a row/col so maybe not?
 * - Single color mode without enough symbols will fail.
 *     The same applies to single symbol mode and colors as well as exclusive symbols with a small symbol set.
 *     Enabling rotation will likely prevent these from failing
 * - Disabling the safety will allow for explicitly bad combination (one color, one symbol, no rotation)
 *       but will also interfere with standard generation, so only disable if you want it to be bad.
 *     Duplicate tiles will not be interchangeable unless the nonce is off
 * - Always inverting color can look nice at high saturations but may result in poor contrast with some colors.
 *
 * Idea: Reverse-colorblind mode, colors are generated notably close to each other. Maybe a similar rotation mode.
 *
 * @param {number} size - Puzzle size, always square.
 * @param {number} steps - Number of times to slide the initial puzzle rows/columns.
 * @param {number} shuffles - !! Randomly shuffle tiles n times. basically guaranteed to break the puzzle.
 * @param {null|string} image_override - Use an image instead of symbols. Maybe the user's profile picture? :)
 * @param {string} symbol_set - Symbol set to choose from first (then fallback to default)
 * @param {boolean} exclusive_symbols - !! Only choose from selected symbol set
 * @param {null|string} single_symbol - !! Only use the symbol name provided.
 * @param {string} color_set - Color scheme to pick from.
 * @param {boolean} single_color - !! Only pick one color. TODO: have this be the color code?
 * @param {string} invert_symbol - Set symbol stroke to the background's inverse. One of 'always', 'dark', 'B&W', or 'never'
 * @param {boolean} rotation - Rotate symbols randomly.
 * @param {boolean} safety - Generator safety override.
 * @param {boolean} nonce - Prevents duplicate tiles (prevented by safety) from being interchangeable
 */
function plan_content({size, steps, shuffles = 0,
                      image_override= null,
                      symbol_set= 'emojis', exclusive_symbols = false, single_symbol = null,
                      color_set = 'default', single_color = false, invert_symbol = 'always',
                      rotation = true, safety= true, nonce = true} = {}) {

    if (! (size || steps)) {
        throw new Error('size or steps must be invalid');
    }

    if (image_override == null && safety) {
        // oh baby I don't think I've used a ternary in 8 years
        const color_total = single_color ? 1 : colors.get(color_set).length;
        // Good habits never die
        //  overlap of requested and default set not considered because it's tedious and you're probably fine.
        const symbol_total = single_symbol ? 1 : exclusive_symbols ? symbols.get(symbol_set).length : symbols.get('default').length;
        // I ALREADY TOLD YOU IT'S FINE! ...probably
        const rotation_total = rotation ? 36 : 1;
        if (color_total * symbol_total * rotation_total < size * size) {
            throw new Error("Not enough potential tiles :(");
        }
    }

    // RENDER NOTE BEFORE I FORGET:
    //  style="filter: invert(1);"
    // but also that doesn't apply to background, only color. so if we set color to background and filter doesn't work
    //  then everything is invisible, whoops. I may be willing ot take that risk
    const code_set = new Set()
    const tiles = [];
    const total_tiles = size * size;

    let color_pool = [];
    let symbol_pool = [];
    const symbols_exhausted = false;
    const only_color = single_color ? colors[color_set][getRandomInt(colors[color_set].length)] : false;
    const only_symbol = single_symbol ? single_symbol : false;

    do {
        // refill color pool
        if (color_pool.length === 0) {
            // shallow copy alert
            // You can't index a map???? why is colors[color_set] undefined
            color_pool = only_color ? [only_color] : Array.from(colors.get(color_set));
        }
        // refill symbol pool
        if (symbol_pool.length === 0) {
            // Have I mentioned I've missed ternaries?
            symbol_pool = only_symbol ? [only_symbol] : Array.from(symbols_exhausted ? symbols.get('default') : symbols.get(symbol_set));
        }
        const selected_color_idx = getRandomInt(color_pool.length);
        const selected_color = color_pool[selected_color_idx];
        const selected_symbol_idx = getRandomInt(symbol_pool.length);
        const selected_symbol = symbol_pool[selected_symbol_idx];
        const selected_rotation = rotation ? getRandomInt(36) * 10 : 0; // 0 - 350 in increments of 10
        const tile_code = selected_color + '!' + selected_symbol + '!' + selected_rotation;

        // unique tile or we don't care
        if (! code_set.has(tile_code) || ! safety) {
            const tile = document.createElement('div');
            tile.classList.add('puzzle-tile');
            tile.style.background = selected_color;

            const symbol = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            if (invert_symbol === 'always' || (invert_symbol === 'dark' && color_is_dark(selected_color)) ) {
                symbol.setAttribute('fill', selected_color);
                // big uh-oh, if something can't do invert they will be invisible lol
                symbol.setAttribute('filter', 'invert(1)');
            } else if (invert_symbol === 'B&W') {
                if (color_is_dark(selected_color)) {
                    symbol.setAttribute('fill', 'white')
                } else {
                    symbol.setAttribute('fill', 'black')
                }
            }
            if (rotation && selected_rotation) {
                symbol.setAttribute('transform', `rotate(${selected_rotation})`);
            }
            symbol.innerHTML = `<use xlink:href="bootstrap-icons.svg#${selected_symbol}"/>`;
            tile.appendChild(symbol);

            tile.dataset.index = tiles.length.toString();
            tile.dataset.code = nonce ? tile_code + '!' + get_nonce(6) : tile_code;

            color_pool.splice(selected_color_idx, 1);
            symbol_pool.splice(selected_symbol_idx, 1);
            code_set.add(tile_code);
            tiles.push(tile);
        }
    } while (tiles.length !== total_tiles);

    // ...why do I return the grid anyway, I don't think it has any use.
    const [grid, actual_moves, pos_map] = plan_puzz(size, steps, shuffles)
    return [tiles, pos_map, actual_moves]
}

const puzzleContainer = document.getElementById('puzzle-container');
const solutionContainer = document.getElementById('solution-container');
const captchaContainer = document.getElementById('captcha-container');
const controlContainer = document.getElementById('control-container');

// OH IM STILLLL IN A DREEAAAAM
const clickEater = document.getElementById('click-eater');

const text_dump = document.getElementById('aa');


let humanity_active = true;
let humanity_nudge_cycle = 0;
const humanity_level = document.getElementById('humanity');
const humanity_human = document.getElementById('human-tile');
const humanity_robot = document.getElementById('robot-tile');
/**
 * Tweak humanity bar. Bar never passes 5% either end (10?).
 *  Large movement always swings in the other direction
 * @param {string} scale - One of 's', 'm', or 'l'
 */
function humanity_adjust(scale) {
    // the got dang rng system doesn't have distributions
    if (humanity_active) {
        let move = getRandomInt(7);
        let recenter = false;
        switch (scale) {
            case 's':
                // +- 10 units
                humanity_nudge_cycle += 1;
                if (humanity_nudge_cycle > 5 && Math.random() > 0.7) {
                    recenter = true;
                    humanity_nudge_cycle = 0;
                } else {
                    break;
                }
                // YES I WANT THE FALLTHROUGH SHUT UP WEBSTORM - why did that work lol
            case 'm':
                // 7s because it'll be less... round looking.
                // +- 10-27 units
                move += getRandomInt(12); // make it +-17
                move += 10; // shift it over 10
                break;
            case 'l':
                // +- 37-47 units
                move += 31;
                recenter = true;
                break;
        }
        if ((recenter && uiState.humanity > 50) || Math.random() > 0.5) {
            move = -move;
        }

        move = Math.max(4, Math.min(95, uiState.humanity + move));

        requestAnimationFrame(() => {
            humanity_level.style.transform = `scaleX(${move}%)`;
            humanity_robot.classList.remove('alert');
            humanity_human.classList.remove('alert');
            void humanity_human.offsetWidth;
            void humanity_robot.offsetWidth;
            if (move > 70) {
                humanity_robot.classList.add('alert');
            } else if (move < 25) {
                humanity_human.classList.add('alert');
            }
            uiState.humanity = move;
        });
    }
}
function register_humanity() {
    humanity_level.style.transform = 'scaleX(50%)';
    // FIXME: setup variable callback chain
    setInterval(() => {humanity_adjust('s')}, 3000)
}

/**
 * Flash SVG - call inside an anim frame.
 * @param elem - SVG element
 */
function button_flash(elem) {
    elem.style.animation = 'none';
    void elem.getBoundingClientRect(); // this forces things to recalculate so the animation reapplies
    elem.style.animation = 'var(--button-flash-animation-params)';
}

function renderInfo() {
    const info_items = document.getElementsByClassName('info-panel');
    const id_items = document.getElementsByClassName('container-id');

    if (uiState.info) {
        for (const item of info_items) {
            item.classList.add('active');
        }
        for (const item of id_items) {
            item.classList.add('active');
            item.style.animation = 'none'; // https://youtu.be/0Wtcn_MkKL8
        }
        clickEater.classList.add('active', 'info');
    } else {
        clickEater.classList.remove('active', 'info');
        for (const item of info_items) {
            item.classList.remove('active');
        }
        for (const item of id_items) {
            item.classList.remove('active');
        }
    }
}

function register_info() {
    const info_button = document.getElementById('control-1');
    info_button.addEventListener('click', (event) => {
        event.stopPropagation(); // ?? who else could have this event
        uiState.info = true;
        scheduleRender();
    });

    clickEater.addEventListener('click', (event) => {
        if (uiState.info) {
            uiState.info = false;
            // WHOOPS, we need to transition state from init info to... Whatever is next. Start I guess,
            if (uiState.global === 'info') {
                uiState.global = 'start';
            }
            scheduleRender();
        }
    });
}

// lots of nice options - tringle, dot, octagon, diamond, etc
const progress_shape = 'triangle';
/**
 * Render progress graphic - does not request frame
 */
function progressRender() {
    // I gotta figure out animation frames and different functions doing what.
    //  if I request a frame inside a frame it goes to the next frame which isn't ideal.
    // FIXME: it's still gonna blink the whole bar on update, split into build and update funcs.
    //  tbh the blink is probably just safari
    // FIXME: intiial state should be empty (check global ui not in load/ensure state in play for current idx)
    if (puzzles.length > 1 && uiState.progress_update) {
        const progressContainer = document.getElementById('addon-progress');

        progressContainer.parentElement.classList.add('show-progress');
        uiState.progress_update = false;

        progressContainer.innerHTML = '';
        if (uiState.puzzleid !== -1) {
            const full_tile = document.createElement('div');
            full_tile.classList.add('tile-base');
            const full_symbol = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            full_symbol.innerHTML = `<use xlink:href="bootstrap-icons.svg#${progress_shape}-fill"/>`
            full_tile.appendChild(full_symbol);
            for (let i = 0; i < (uiState.puzzleid - 1); i++) {
                progressContainer.appendChild(full_tile.cloneNode(true));
            }

            const half_tile = document.createElement('div');
            half_tile.classList.add('tile-base');
            const half_symbol = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            half_symbol.innerHTML = `<use xlink:href="bootstrap-icons.svg#${progress_shape}-half"/>`
            half_tile.append(half_symbol)
            progressContainer.appendChild(half_tile);
        }

        const empty_tile = document.createElement('div');
        empty_tile.classList.add('tile-base');
        const empty_symbol = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        empty_symbol.innerHTML = `<use xlink:href="bootstrap-icons.svg#${progress_shape}"/>`;
        empty_tile.append(empty_symbol);

        for (let i = uiState.puzzleid < 0 ? 0 : uiState.puzzleid; i < puzzles.length - 1; i++) {
            progressContainer.appendChild(empty_tile.cloneNode(true));
        }
    }
}


let initialized = false;
/**
 * Inject button control logic, etc
 */
function inject_controls() {
    if (!initialized) {
        initialized = true; // idk what could call this multiple times but idk what would happen if you did

        register_info();

        register_flipper();

        register_reset();

        register_quit();

        register_humanity();

        register_arrows();

    }

}

function inject_debug() {
    // TODO: unhook overflow on main div, glue on a panel to control puzzle zero settings
}


function tile_clicked(event) {
    // on click, highlight the row/col, lowlight the others.
    //  when clicking the already selected tile, clear everything.
    const clicked_base = event.target.closest('.tile-base');
    // const border_thickness = event.target.offsetWidth

    if (clicked_base.dataset.active) {
        // kill the lights
        uiState.active_tile = [];
        requestAnimationFrame(() => {
            const base_tiles = Array.from(puzzleContainer.querySelectorAll('.tile-base'));
            base_tiles.forEach(item => {
                // item.classList.add('disabled-hover');
                const overlay = item.querySelector('.tile-overlay');
                delete item.dataset.active;
                overlay.classList.remove('highlighted', 'lowlighted', 'active-tile');
            });
        });
    }
    else {
        // highlight/lowlight
        uiState.active_tile = [clicked_base.dataset.row, clicked_base.dataset.col];
        requestAnimationFrame(() => {
            const base_tiles = Array.from(puzzleContainer.querySelectorAll('.tile-base'));
            base_tiles.forEach(item => {
                // item.classList.add('disabled-hover');
                const overlay = item.querySelector('.tile-overlay');
                delete item.dataset.active;
                overlay.classList.remove('highlighted', 'lowlighted', 'active-tile');
                if (item.dataset.col === clicked_base.dataset.col ||
                    item.dataset.row === clicked_base.dataset.row) {
                    overlay.classList.add('highlighted');
                } else {
                    overlay.classList.add('lowlighted');
                }
                delete overlay.parentElement.dataset.active;
            });
            clicked_base.dataset.active = "yes";

            //const color = invert_style_color(clicked_base.querySelector('.puzzle-tile').style.background);

            //overlay.style.outlineColor = color;
            // event.target.style.setProperty('--active-outline-color', color);
            event.target.classList.add('active-tile');
        });
    }
}

const puzzles = [
    {
        size: size, steps: steps, shuffles: shuffle,
        symbol_set: 'mycoin', exclusive_symbols: true,
        color_set: 'default', invert_symbol: 'B&W', rotation: false
    },
    {
        size: 4, steps: 5, shuffles: false,
        symbol_set: 'subscribe', exclusive_symbols: true,
        color_set: 'another_three', invert_symbol: true, rotation: true
    }
];


function intiializeBoard() {

    // get blasted
    puzzleContainer.innerHTML = '';
    puzzleContainer.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    puzzleContainer.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    puzzleContainer.style.gap = '0px';

    solutionContainer.innerHTML = '';
    solutionContainer.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    solutionContainer.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    solutionContainer.style.gap = '0px';

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const idx = j + (size * i);
            // Lol a second .appendChild yoinks it away from the first parent (something something custody).
            //  although I bet you could do some tricky stuff with that.
            // this is the easy one, you can have the generated tile
            solutionContainer.appendChild(tiles[idx]);

            // you... are a problem
            const base_element = document.createElement('div');
            base_element.classList.add('tile-base');
            base_element.dataset.col = j.toString();
            base_element.dataset.row = i.toString();
            base_element.dataset.index = idx.toString();

            const puzzle_tile = tiles[init_map.get(idx)].cloneNode(true);
            base_element.appendChild(puzzle_tile);

            const overlay = document.createElement('div');
            overlay.classList.add('tile-overlay');

            overlay.addEventListener('click', tile_clicked)
            base_element.appendChild(overlay);

            puzzleContainer.appendChild(base_element);
        }
    }
}

function render_puzzle() {
    const [tiles, init_map, moves] = plan_content(puzzles[uiState.puzzleid]);

    requestAnimationFrame(() => {
        // get blasted
        puzzleContainer.innerHTML = '';
        puzzleContainer.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        puzzleContainer.style.gridTemplateRows = `repeat(${size}, 1fr)`;
        puzzleContainer.style.gap = '0px';

        solutionContainer.innerHTML = '';
        solutionContainer.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        solutionContainer.style.gridTemplateRows = `repeat(${size}, 1fr)`;
        solutionContainer.style.gap = '0px';

        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const idx = j + (size * i);
                // Lol a second .appendChild yoinks it away from the first parent (something something custody).
                //  although I bet you could do some tricky stuff with that.
                // this is the easy one, you can have the generated tile
                solutionContainer.appendChild(tiles[idx]);

                // you... are a problem
                const base_element = document.createElement('div');
                base_element.classList.add('tile-base');
                base_element.dataset.col = j.toString();
                base_element.dataset.row = i.toString();
                base_element.dataset.index = idx.toString();

                const puzzle_tile = tiles[init_map.get(idx)].cloneNode(true);
                base_element.appendChild(puzzle_tile);

                const overlay = document.createElement('div');
                overlay.classList.add('tile-overlay');

                // I like border dashed but it has an inconsistent number of dashes which gets me
                //  This is really the only somewhat reasonable svg in the set for this
                //   and I still don't like it.
                // Maybe border inset is fine. Or groove.
                /*
                const avtivity_symbol = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                avtivity_symbol.hidden = true;
                avtivity_symbol.style.width = '95%';
                avtivity_symbol.style.height = '95%';
                avtivity_symbol.setAttribute('fill', puzzle_tile.style.background);
                // big uh-oh, if something can't do invert they will be invisible lol
                avtivity_symbol.setAttribute('filter', 'invert(1)');
                avtivity_symbol.innerHTML = `<use xlink:href="bootstrap-icons.svg#fullscreen"/>`;
                overlay.appendChild(avtivity_symbol);
                */

                overlay.addEventListener('click', tile_clicked)
                base_element.appendChild(overlay);

                puzzleContainer.appendChild(base_element);
            }
        }
    });

    text_dump.innerText += `${moves}`;
}

function slideRender() {

}

function register_arrows() {
    const up = document.getElementById('control-2');
    const down = document.getElementById('control-8');
    const left = document.getElementById('control-4');
    const right = document.getElementById('control-6');
    const slide_overlay = document.getElementById('slide-overlay')
    const click_eater = document.getElementById('click-eater');

    function arrowUnlock() {
        click_eater.classList.remove('block');
        slide_overlay.classList.remove('active');
    }

    function arrowhandler(event, direction) {
        if (uiState.active_tile.length === 0) {
            return; // why do you waste my time like this
        }

        // lock up the ui instantly, it's also invisible and one change so screw frames
        click_eater.classList.add('block'); // blocked but not active, no click events probably.
        const tile_collection = puzzleContainer.getElementsByClassName('puzzle-tile');

        // suck up current state
        const size = puzzles[uiState.puzzleid].size;
        const vert = direction === 'u' || direction === 'd'

        // pull out row/col that is moving before reorg
        const grid = [];
        const active_row = [];
        for (let i = 0; i < size; i++) {
            grid[i] = [];
            for (let j = 0; j < size; j++) {
                const idx = j + (size*i);
                const tile = puzzleContainer.children[idx];
                grid[i][j] = tile.getElementsByClassName('puzzle-tile')[0];

                if ((!vert && i === uiState.active_tile[0]) || (vert && j === uiState.active_tile[1])) {
                    const idx = j + (size*i);
                    active_row.push(puzzleContainer.children[idx]);
                }
            }
        }

        // jumble internal data
        if (vert) {
            column_shift(uiState.grid, uiState.active_tile[0], direction === 'd' ? -1 : 1)
        } else {
            row_shift(uiState.grid, uiState.active_tile[1], direction === 'l' ? -1 : 1)
        }

        requestAnimationFrame(() => {
            // OH MY GOD I CAN PULL THE LOCATIONS FROM THE TILES PHEW
            slide_overlay.classList.add('active');
            clickEater.classList.add('block');
            slide_overlay.innerHTML = '';

            const overlay_rect = slide_overlay.getBoundingClientRect();

            for (let i = 0; i < size; i++) {
                const slide_copy = active_row[i].cloneNode(true);
                const tile_rect = active_row[i].getBoundingClientRect();

                slide_copy.style.position = 'absolute';
                slide_copy.style.display = 'block';
                slide_copy.style.top = `${tile_rect.top - overlay_rect.top}px`;
                slide_copy.style.left = `${tile_rect.left - overlay_rect.left}px`;
                slide_copy.style.width = `${tile_rect.width}px`;
                slide_copy.style.height = `${tile_rect.height}px`;

                slide_overlay.appendChild(slide_copy);
            }
            // and then glue one on the end
            const slide_copy = active_row.at(direction === 'u' || direction === 'l' ? 0 : -1).cloneNode(true);
            // haha big brain am winning again, I only need to slide the entire div, not each member.
            //  lmao it incredibly will NOT work that way
            let tx = 'idk im dumb!'
            if (vert) {
                const tile_rect = active_row.at(direction === 'u' ? -1 : 0).getBoundingClientRect();
                slide_copy.style.left = `${tile_rect.left - overlay_rect.left}px`;
                if (direction === 'u') {
                    slide_copy.style.top = `${tile_rect.bottom - overlay_rect.top}px`;
                    tx = `translateY(-${tile_rect.height}px)`
                } else {
                    slide_copy.style.top = `${overlay_rect.top - tile_rect.height}px`;
                    tx = `translateY(${tile_rect.height}px)`
                }
            } else {
                const tile_rect = active_row.at(direction === 'l' ? -1 : 0).getBoundingClientRect();
                slide_copy.style.top = `${tile_rect.top - overlay_rect.top}px`;
                if (direction === 'l') {
                    slide_copy.style.left = `${tile_rect.right - overlay_rect.left}px`;
                    // eugh why are my widths trying to access the secret robot internet but not my heights
                    tx = `translateX(-${tile_rect.width}px)`
                } else {
                    slide_copy.style.left = `${overlay_rect.left - tile_rect.width}px`;
                    tx = `translateX(${tile_rect.width}px)`
                }
            }
            slide_copy.style.position = 'absolute';
            slide_copy.style.display = 'block';
            slide_copy.style.width = active_row[0].offsetWidth + 'px';
            slide_copy.style.height = active_row[0].offsetHeight + 'px';
            slide_overlay.appendChild(slide_copy);
            // HAVE to force reflow because this object starts in the overflow
            //  the others don't seem to need it
            void slide_copy.offsetWidth;
            slide_copy.style.transform = tx;

            for (const child of slide_overlay.children) {
                child.style.transform = tx;
            }

            slide_overlay.firstChild.addEventListener('transitionend', () => {
                requestAnimationFrame(() => {
                    slide_overlay.innerHTML = ''; // get blasted
                    slide_overlay.style.transform = ''; // just to be clean
                    slide_overlay.classList.remove('active');
                    clickEater.classList.remove('block');
                })
            }, {once: true});
        });
    }

    up.addEventListener('click', (event) => {
        arrowhandler(event, 'u');
    });
    down.addEventListener('click', (event) => {
        arrowhandler(event, 'd');
    });
    left.addEventListener('click', (event) => {
        arrowhandler(event, 'l');
    });
    right.addEventListener('click', (event) => {
        arrowhandler(event, 'r');
    });
}

/*
DUMP FROM NOTES:

Slider

Configurable:
* Size
* Soln Length
* Image
* Max move multiplier
* Piece shuffler - makes impossible?
* Generation time (. . . Go, each 1/4 of time arg)
* Slide time option to make it incredibly slow
* Default is symbols/colors? Single symbol mode that does rotation. Default also does rotation but symbol is unique? Color similarity mode?

Reset button does not refund moves, goes back to original layout. Only running out regenerates
have the button that makes a new puzzle go "you still have moves, don't give up :)"

render a little overlay on the solution to show which are correct? little checkmark or x in the corner?
*/
