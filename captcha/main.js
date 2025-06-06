/**
 * Construct puzzle initial state
 * @param {number} size - puzzle size, NxN
 * @param {number} shifts - Number of row/column shifts (min solution moves is (generally) between [shifts] and [floor(size/2)*shifts] )
 * @param {number} shuffle - shuffle pieces. A single swap can easily make it impossible
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

    const pos_map = new Map()
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            // tile x is now at y
            pos_map.set(grid[i][j], j + (size*i));
        }
    }


    return [grid, actual_moves, pos_map];
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

let size = 4;
let steps = 4;
let shuffle = 0;

plan_puzz(size, steps, shuffle)


// https://coolors.co/palette/2f3e77-f5b841-f4ece3-2cb67d-ff4f5e-4ac6ff-ff6a3d
const colors = ['#2f3e77','#f5b841','#f4ece3','#2cb67d','#ff4f5e','#4ac6ff','#ff6a3d'];
// another I like https://coolors.co/palette/f94144-f3722c-f8961e-f9844a-f9c74f-90be6d-43aa8b-4d908e-577590-277da1
// const colors = ['#f94144', '#f3722c', '#f8961e', '#f9844a', '#f9c74f', '#90be6d', '#43aa8b', '#4d908e', '#577590', '#277da1']

// whitelist of the symbol set to narrow it down
//  also you're gonna want them to not by radially symmetric in any way for certain hell modes
//  ... or maybe you do
// TODO: finish
const symbols = ['!','@','#','$','%','^','&'];


// require the puzzle to contain these in some form
//  alt mode to force only from this set
const demanded_symbols = new Map([
    // like and subscribe
    ['subscribe', ['youtube', 'hand-thumbs-up', 'sunglasses', 'twitch']],
    // chicken paul
    ['paul', ['egg', 'fire', 'egg-fried']],
    // go to the bank and withdraw the funds - conveniently the size of a 3x3
    //  I like chat-left-text but I feel headset is more appropriate. No old school phone icons.
    ['withdrawfunds', ['headset', 'car-front', 'bank', 'person-vcard', 'credit-card-2-back',
        'cash-coin', 'currency-exchange', 'currency-bitcoin']],
    // MyCoin is a very real, award-winning financial establishment I'll have you know
    //  VERY tempted to add more copies of award
    ['mycoin', ['currency-exchange', 'cash-coin', 'safe', 'briefcase',
        'currency-bitcoin', 'currency-euro', 'currency-dollar', 'currency-yen', 'currency-rupee', 'currency-pound',
        'buildings', 'bank', 'calculator', 'graph-up-arrow', 'award', 'headset']],
    // Emojos
    ['emojis', ['emoji-grin', 'emoji-astonished', 'emoji-grimace', 'emoji-smile-upside-down',
        'emoji-wink', 'emoji-kiss', 'emoji-neutral', 'emoji-expressionless', 'emoji-tear', 'emoji-dizzy', 'emoji-frown',
        'emoji-surprise', 'emoji-smile', 'emoji-heart-eyes', 'emoji-laughing', 'emoji-sunglasses', 'emoji-angry']],
    // Dice
    ['dice', ['dice-2','dice-3','dice-1','dice-4','dice-5','dice-6']]
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

const puzzleContainer = document.getElementById('puzzle-container');
const solutionContainer = document.getElementById('solution-container');

function render_puzzle() {
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
            const tile = document.createElement('div');
            tile.classList.add('puzzle-tile');
            tile.style.background = colors[getRandomInt(colors.length)];
            // tile.innerText = symbols[getRandomInt(symbols.length)];
            // happy pride, idk why the class is bi
            tile.innerHTML = `<svg class="bi" fill="currentColor"><use xlink:href="svg/bootstrap-icons.svg#sunglasses"/></svg>`
            //tile.firstChild.setAttribute('transform', 'rotate(45)');

            tile.dataset.num = j + (size*i);
            puzzleContainer.appendChild(tile);

            const solutionTile = document.createElement('div');
            solutionTile.classList.add('puzzle-tile');
            solutionTile.style.background = tile.style.background;
            solutionTile.innerHTML = tile.innerHTML;
            // this is bad actually, but the upper tile nums are wrong. and need to be set by initial state
            solutionTile.dataset.num = tile.dataset.num;
            solutionContainer.appendChild(solutionTile);
        }
    }


    // need to pick apart modes, figure out html/css for each and re-inject. or plan ahead of time.
    // That's probably smarter

    // base mode would pull from symbol set generically without replacement and pair with a color (also no replace)
    //  (no replace until forced, that is). Also generate rotation but that is more complicated wrt: tracking
    //   We should try to avoid near angles of the same color/symbol pair
    //  track generated (as string I guess) for rejection. I don't like all this random selection w/ reject
    //   this should be less bad compared to init shuffle... probably.
    // alt mode would pull from forced set first, then generic (repeat warning) OR only set.
    //  Potential exhaustion based on definition of "near" angles and bad symbol/tile ratio
    // alt mode is single color all same symbol, rotation only, uncap nearness check, or reduce significantly
    // also the option to just have it be a picture lmao all my work!!!!

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
*/
