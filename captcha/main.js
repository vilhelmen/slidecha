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

function color_is_dark(color_code) {
    // pls I just want a color type.
    const color = parseInt(color_code.slice(1), 16);
    // uhh I guess the true midpoint would be 384. Let's go with the mean value instead of sum < 300
    if (((color & 0xFF) + ((color & 0xFF00) >> 8) + ((color & 0xFF0000) >> 16)) / 3 < 128) {
        return true;
    }
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

let size = 3;
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
        let tile_number = 0;

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

            tile.dataset.index = tile_number.toString();
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

const text_dump = document.getElementById('puzzle-addons');

function tile_clicked(event) {
    const clicked_base = event.target.parentElement;
    if (clicked_base.dataset.active) {
        requestAnimationFrame(() => {
            const base_tiles = Array.from(puzzleContainer.querySelectorAll('.tile-base'));
            base_tiles.forEach(item => {
                // item.classList.add('disabled-hover');
                const overlay = item.querySelector('.tile-overlay');
                delete item.dataset.active;
                overlay.classList.remove('highlighted', 'lowlighted');
            });
        });
    }
    else {
        requestAnimationFrame(() => {
            const base_tiles = Array.from(puzzleContainer.querySelectorAll('.tile-base'));
            base_tiles.forEach(item => {
                // item.classList.add('disabled-hover');
                const overlay = item.querySelector('.tile-overlay');
                delete item.dataset.active;
                if (item.dataset.col === clicked_base.dataset.col ||
                    item.dataset.row === clicked_base.dataset.row) {
                    overlay.classList.add('highlighted');
                    overlay.classList.remove('lowlighted');
                } else {
                    overlay.classList.remove('highlighted');
                    overlay.classList.add('lowlighted');
                }
                delete overlay.parentElement.dataset.active;
            });
            event.target.parentElement.dataset.active = "yes";
        });
    }
}

function render_puzzle() {
    puzzleContainer.innerHTML = '';
    puzzleContainer.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    puzzleContainer.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    puzzleContainer.style.gap = '0px';

    solutionContainer.innerHTML = '';
    solutionContainer.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    solutionContainer.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    solutionContainer.style.gap = '0px';

    const [tiles, init_map, moves] = plan_content(
        {
            size: size, steps: steps, shuffles: shuffle,
            symbol_set: 'mycoin', exclusive_symbols: true,
            color_set: 'default', invert_symbol: 'B&W', rotation: false
        });

    requestAnimationFrame(() => {
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const idx = j + (size * i);
                // Lol a second .appendChild yoinks it away from the first parent (something something custody).
                //  although I bet you could do some tricky stuff with that.
                // this is the easy one, you can have the real tile
                solutionContainer.appendChild(tiles[idx]);

                // you... are a problem
                const base_element = document.createElement('div');
                base_element.classList.add('tile-base');
                base_element.dataset.col = j.toString();
                base_element.dataset.row = i.toString();
                base_element.dataset.index = idx.toString();

                const puzzle_tile = tiles[idx].cloneNode(true);
                base_element.appendChild(puzzle_tile);

                const overlay = document.createElement('div');
                overlay.classList.add('tile-overlay');
                overlay.addEventListener('click', tile_clicked)
                base_element.appendChild(overlay);

                puzzleContainer.appendChild(base_element);
            }
        }
    });

    text_dump.innerText += ` :: expected moves to soln: ${moves}`;
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
