/**
 * Construct puzzle initial state
 * @param {number} size - puzzle size, NxN
 * @param {number} shifts - Number of row/column shifts (min solution moves is (generally) between [shifts] and [floor(size/2)*shifts] )
 * @param {number} shuffle - shuffle pieces. A single swap can easily make it impossible
 */
function plan_puzz(size = 3, shifts= 5, shuffle = 0) {
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
    let magnitude; // how far to shift
    // actually, we need to track our moves because of wrap around
    let actual_moves = 0;

    const rollover = Math.floor(size/2)

    for (let i = 0; i < shifts; i++) {
        vert = Math.random() < 0.5 // vert or horz
        position = getRandomInt(size);
        // it's modular so there's a max of size-1 moves, but also we don't want 0 moves, so -1 +1
        magnitude = getRandomInt(size - 1) + 1

        // Like I mentioned, wrap around, so if it's past the center the technical solution goes the other way
        if (magnitude <= rollover) {
            actual_moves += magnitude
        } else {
            actual_moves += magnitude - rollover
        }

        // Are our moves sufficiently distributed if we skip the opposite direction?
        //  We cut off the symmetric part so... yes? Ignoring things that approach cryptographic security, at least.
        if (vert) {
            // that's... columns
            column_shift(grid, position, magnitude)
        } else {
            // THE OTHER ONE
            row_shift(grid, position, magnitude)
        }
    }

    return [grid, actual_moves];
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
        grid[0][i][idx] = tmprow[0][idx]
    }
}


// ALRIGHT. We need to:
// 1. generate the puzzle. This is easy. Tragically I've already finished it (probably)
//  TODO: mod to return cell mapping array. Just compute it post-facto lol
//   ALSO I FORGOT THE SHUFFLE SETTINGS
// 2. Figure out ~art~ modes and gen HTML/CSS for slots. Image, symbols+colors, hell modes.
// 3. Dump to play area
// 4. Start play loop, activate further hell settings
console.log(plan_puzz())

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
