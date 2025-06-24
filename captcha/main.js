// does this map make my state look big?
//  also idk what this type is oh no help
const uiState = {
    global: 'info', // info -> start -> load -> play -> (win/lose) -> ([there is no end state]]/load)
    quit: 'start', // start, off, waiting, lose, exit
    reset: 'off', // off, waiting
    info: false, // info is currently up
    // timer controls have escaped containment
    // timer: false, // run the timer
    render: {
        quit: false, // update quit system
        reset: false, // update reset system
        info: true, // flip info state
        flip: false, // do a flip
        progress: true, // update progress state
        humanity: true, // update humanity level
        puzzle: false, // update puzzle state
        reaffirm: false, // you can do it (:

        tile_time: 150, // ms to fake load a tile
        do_reset: false, // reset puzzle board to start

        // jk, slides are wrangled by the arrow handler because they're ~complicated~
        // JK IT'S BACK I HATE RENDERING
        slide: false, // so slide anim
        slide_direction: null, // direction code

        can_protect: false, // the protector file was loaded (SAFARI I SWEAR TO GOD)
        protector: null, // callback id

        relight: false, // fiddle with tile lighting
        moves: false // update move count
    },
    puzzleid: 0, // current puzzle
    // humanity: 50, // humanity relocated to its own little bundle

    move: null, // current move
    total_moves: null, // total moves for current puzzle, -1 = inf

    expected_moves: null,
    current_solution: null,
    tile_map: null, // tile mapping from the generator
    current_board: null,

    time: null, // timer start

    active_tile: null, // active tile node
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

    if (uiState.render.info) {uiState.render.info = false; infoRender();}
    if (uiState.render.quit) {uiState.render.quit = false; quitRender();}
    if (uiState.render.reaffirm) {uiState.render.reaffirm = false; affirmRender();}
    if (uiState.render.reset) {uiState.render.reset = false; resetRender();}
    if (uiState.render.flip) {uiState.render.flip = false; flipRender();}
    if (uiState.render.humanity) {uiState.render.humanity = false; humanityRender();}
    if (uiState.render.progress) {uiState.render.progress = false; progressRender();}
    // timer renderer exists outside scheduler because it (was) a busy boy
    if (uiState.render.moves) {uiState.render.moves = false; movesRender();}
    // Slide needs to go before relight because it will kick one off and I won't bother calling a new frame
    // Slide will also trigger a move render but it's FINE.
    if (uiState.render.slide) {uiState.render.slide = false; slideRender();}
    if (uiState.render.relight) {uiState.render.relight = false; relightRender();}
    if (uiState.render.puzzle) {uiState.render.puzzle = false; puzzleRender();}
}

function formatTime(ms) {
    if (ms > 356400000) {
        // congrats, have a performance gain :)
        // stop_timer(); WHOOPS that's an infinite loop. Can't have this locking up after uhhh 4? days?
        //  it would have stopped the animation (now that it has one) anyway
        return '+99:99:99.9'
    }
    let seconds = Math.floor(ms / 1000);
    let minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    seconds %= 60;
    minutes %= 60;

    // How do I import left-pad
    const fH = hours.toString().padStart(2, '0');
    const fM = minutes.toString().padStart(2, '0');
    const fS = seconds.toString().padStart(2, '0');

    return `${fH}:${fM}:${fS}`;
}
const timerSpan = document.getElementById('time');
const timerAddon = document.getElementById('addon-timer');
const timerIcon = document.getElementById('timer-icon');
let timerFunc = null;
function timerRender() {
    // no I don't know the difference in text objects and no the popup in webstorm saying what it is does not help
    timerSpan.textContent = formatTime(performance.now() - uiState.time);
}
function start_timer() {
    // HOO BABY THIS PUPPY RUNS LIKE TRASH
    //  well even when changed from a frame loop to an interval at 100ms it didn't help enough
    // Tragic, 1s accuracy it is then.
    if (timerFunc === null){
        uiState.time = performance.now();
        timerSpan.textContent = timerSpan.dataset.reset; // likely necessary
        timerFunc = setInterval(timerRender, 1000);

        timerAddon.classList.add('flip');
        timerAddon.addEventListener('transitionend', function handler() {
            requestAnimationFrame(() => {
                timerAddon.classList.remove('flip');
                timerIcon.classList.remove('stop');
            });
        }, {once: true});
    }
}
function stop_timer(reset = false) {
    if (timerFunc !== null) {
        clearInterval(timerFunc);
        timerFunc = null;
        timerRender(); // render the last moment, esp since we've got wonky timing

        timerAddon.classList.add('flip');
        timerAddon.addEventListener('transitionend', function handler() {
            requestAnimationFrame(() => {
                if (reset) {timerSpan.textContent = timerSpan.dataset.reset;}
                timerAddon.classList.remove('flip');
                timerIcon.classList.add('stop');
            });
        }, {once: true});
    }
}
function reset_timer() {
    if (timerFunc !== null) {stop_timer(true)}
    else {
        // timer is NOT running, we are just wiping the time. Idk why this happens.
        timerSpan.classList.add('flip');
        timerSpan.addEventListener('transitionend', function handler() {
            requestAnimationFrame(() => {
                timerSpan.textContent = timerSpan.dataset.reset;
                timerSpan.classList.remove('flip');
            });
        }, {once: true});
    }
}

function movesRender() {
    const move_container = document.getElementById('addon-moves');
    const move_icon = document.getElementById('move-icon');
    const move_data = document.getElementById('move-data');

    const total = uiState.total_moves === -1 ? '∞' : uiState.total_moves;

    // big whoops, we never hit start after the first time
    if (uiState.global === 'load') {
        //void move_container.offsetWidth;
        move_container.classList.add('flip');
        move_container.addEventListener('transitionend', function handler() {
            requestAnimationFrame(() => {
                move_icon.classList.remove('dead');
                move_data.innerText = ` ${uiState.move} / ${total}`;
                move_container.classList.remove('flip');
            });
        }, {once: true});
        return;
    }

    move_data.innerText = ` ${uiState.move} / ${total}`;

    // surprise, it's slightly more complicated!
    if (uiState.global === 'lose') {
        move_container.classList.add('flip');
        move_container.addEventListener('transitionend', function handler() {
            move_icon.classList.add('dead');
            requestAnimationFrame(() => {
                move_container.classList.remove('flip');
            });
        }, {once: true});
    }
}

function quitRender() {
    // I'm allowing myself to scan time dom every time I call this fun because
    //  I've gated the access to this function
    const quit_button = document.getElementById('control-7');
    const quit_slider = document.getElementById('quit-confirm');
    const span = quit_slider.getElementsByTagName('span')[0];
    // no I'm not checking the elements, if my buttons fell off the page I can't help you.

    switch (uiState.quit) {
        // we just reuse the reset state for click eater
        case 'start':
            quit_button.classList.add('start');
            quit_slider.classList.add('start');
            if (uiState.global === 'start') {
                span.innerText = 'Click to begin';
            } else {
                span.innerText = 'Next';
            }
            // Wait for the info panel to go away before rendering
            if (uiState.global !== 'info') {
                quit_button.classList.add('active');
                quit_slider.classList.add('active');
                clickEater.classList.add('active', 'block');
                // savor your pretty, pretty image if you won, no fade
                // I changed my mind
                //if (uiState.global !== 'win') {
                clickEater.classList.add('reset');
                //}
            }
            break;
        case 'exit':
            quit_button.classList.add('win', 'active');
            quit_slider.classList.add('win', 'active');
            clickEater.classList.remove('active', 'block');
            span.innerText = 'Click to submit';
            break;
        case 'off':
            quit_button.classList.remove('active', 'start');
            quit_slider.classList.remove('active', 'start');
            // (we technically don't need block because clickEater will only turn off itself iff we're in waiting)
            clickEater.classList.remove('active', 'reset', 'block');
            quit_slider.firstElementChild.innerText = 'New puzzle?';
            break;
        case 'lose':
            span.innerText = 'Try again.';
        // YES I KNOW WEBSTORM FALLTHROUGH (it's the word fall that makes it stop lighting up??)
        case 'waiting':
            quit_button.classList.add('active');
            quit_slider.classList.add('active');
            clickEater.classList.add('active', 'reset');
            if (uiState.quit === 'lose') {
                // again, not strictly necessary
                clickEater.classList.add('block');
            }
            break;
    }
}

function register_quit() {
    const quit_button = document.getElementById('control-7');

    quit_button.addEventListener('click', (event) => {
        event.stopPropagation(); // ?? who else could have this event
        switch (uiState.quit) {
            case 'start':
                uiState.quit = 'off';
                puzzleCycle();
                break;
            case 'off':
                uiState.quit = 'waiting';
                break;
            case 'exit':
                // haha eat pant I don't need to maintain state anymore
                window.top.postMessage("success", '*')
                // ...but I will. kinda. it'll animate something at least to look at
                uiState.quit = 'off';
                humanity.active = false;
                // I don't have a good way to lock the UI more from here without adding states.
                // I didn't even use the exit state
                break;
            case 'lose':
            case 'waiting':
                // requested new puzzle, wreck up the place or get annoying
                if (uiState.global === 'win' || uiState.global === 'lose') {
                    puzzleCycle();
                } else {
                    // GET AFFIRMED, LOSER
                    uiState.render.reaffirm = true;
                }
                uiState.quit = 'off';
        }
        uiState.render.quit = true;
        scheduleRender();
    });

    clickEater.addEventListener('click', (event) => {
        event.stopPropagation();
        // clicked somewhere else
        // haha accidentally perfect because we ignore on exit or lose state, ya gotta click bro
        if (uiState.quit === 'waiting') {
            uiState.quit = 'off';
            uiState.render.quit = true;
            scheduleRender();
        }
    });
}

function resetRender() {
    const reset_button = document.getElementById('control-3');
    const reset_slider = document.getElementById('reset-confirm');

    switch (uiState.reset) {
        case 'off':
            reset_button.classList.remove('active');
            reset_slider.classList.remove('active');
            clickEater.classList.remove('active', 'reset');
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
        if (uiState.global !== 'play') {
            // get ignored loser, I also can't be bothered to turn off the hover
            return;
        }
        switch (uiState.reset) {
            case 'off':
                uiState.reset = 'waiting';
                break;
            case 'waiting':
                uiState.reset = 'off';
                uiState.render.do_reset = true; // lol buckle up
                uiState.active_tile = null; // no relight needed technically
                uiState.render.puzzle = true;
                break;
        }
        uiState.render.reset = true;
        scheduleRender();
    });

    clickEater.addEventListener('click', () => {
        // event.stopPropagation(); // the click can fall through?? this doesn't seem right at all tbh.
        // actually that seems bad I have like 5 listeners for this object.

        // clicked somewhere else
        if (uiState.reset === 'waiting') {
            uiState.reset = 'off';
            uiState.render.reset = true;
            scheduleRender();
        }
    });
}

function flipRender() {
    // no, I will not be naming these consistently, thank you.
    const flip_button = document.getElementById('control-9');

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
    // WEH you reset my transitions!!!
    set_protectors(true);
}

function register_flipper() {
    const flip_button = document.getElementById('control-9');
    flip_button.addEventListener('click', (event) => {
        event.stopPropagation(); // ??
        uiState.render.flip = true;
        scheduleRender();
    });
}

function puzzleRender() {
    if (uiState.global === 'load') {
        // get blasted
        puzzleContainer.innerHTML = '';
        puzzleContainer.style.gridTemplateColumns = `repeat(${puzzles[uiState.puzzleid].size}, 1fr)`;
        puzzleContainer.style.gridTemplateRows = `repeat(${puzzles[uiState.puzzleid].size}, 1fr)`;

        solutionContainer.innerHTML = '';
        solutionContainer.style.gridTemplateColumns = puzzleContainer.style.gridTemplateColumns;
        solutionContainer.style.gridTemplateRows = puzzleContainer.style.gridTemplateRows;

        captchaContainer.classList.remove('spinnnnn');

        // idk where you went but come back
        clickEater.classList.add('block');

        const decor = document.getElementsByClassName('tile-fuzz');
        for (let i = 0; i < decor.length; i++) {
            // force a redraw with the transition snapped off to blink the blur on
            decor[i].classList.add('noanim');
            decor[i].classList.remove('reveal');
            void decor[i].offsetWidth;
            decor[i].classList.remove('noanim');
        }

        // do fake loading anim
        function load_tile() {
            solutionContainer.appendChild(uiState.current_solution[puzzleContainer.childElementCount]);
            puzzleContainer.appendChild(uiState.current_board[puzzleContainer.childElementCount]);
            if (puzzleContainer.childElementCount < uiState.current_board.length) {
                setTimeout(() => {requestAnimationFrame(load_tile)}, uiState.render.tile_time)
            } else {
                uiState.global = 'play';
                uiState.render.progress = true;
                start_timer();
                clickEater.classList.remove('block');
                for (let i = 0; i < decor.length; i++) {
                    decor[i].classList.add('reveal');
                }
                uiState.move = 0; // yes I know I clear this twice it doesn't hurt.
                uiState.render.moves = true;

                // WELCOME TO MY PUZZLE CARNIVAL
                if (puzzles[uiState.puzzleid].spinnnnn) {
                    captchaContainer.classList.add('spinnnnn');
                }
                // go be in a function somewhere else
                set_protectors();

                scheduleRender();
            }
        }
        load_tile();
    }
    else if (uiState.render.do_reset) {
        uiState.render.do_reset = false; // cool bug lol
        // lmao you're gonna regret it
        clickEater.classList.add('block');

        const decor = document.getElementById('loading-decor');
        decor.classList.add('noanim');
        decor.classList.remove('reveal');
        void decor.offsetWidth;
        decor.classList.remove('noanim');

        // big whoops, state desync - flash the current state with the originals again to blip it
        uiState.current_board = uiState.initial_board.map(item => item.cloneNode(true))

        function reload_tile() {
            puzzleContainer.appendChild(uiState.current_board[puzzleContainer.childElementCount]);
            if (puzzleContainer.childElementCount < uiState.current_board.length) {
                setTimeout(() => {requestAnimationFrame(reload_tile)}, uiState.render.tile_time)
            } else {
                clickEater.classList.remove('block');
                decor.classList.add('reveal');
            }
        }

        // well I actually wanted this to remove them off then end of the grid
        //  but they don't go out right because we loaded fancy
        function reload_tiles() {
            puzzleContainer.firstChild.remove();
            if (puzzleContainer.childElementCount === 0) {
                setTimeout(() => {requestAnimationFrame(reload_tile)}, uiState.render.tile_time)
            } else {
                setTimeout(() => {requestAnimationFrame(reload_tiles)}, uiState.render.tile_time)
            }
        }
        reload_tiles();
    }
    else if (uiState.global === 'lose') {
        // haha
        // crank it up a few more z notches to block the next button
        clickEater.classList.add('loser');

        function unload_tile() {
            puzzleContainer.children[getRandomInt(puzzleContainer.childElementCount)].remove();
            solutionContainer.lastChild.remove(); // womp womp random del just shifts everything
            if (puzzleContainer.childElementCount !== 0) {
                setTimeout(() => {requestAnimationFrame(unload_tile)}, uiState.render.tile_time);
            } else {
                clickEater.classList.remove('loser'); // but we all know it to be true
            }
        }
        unload_tile();
    }
}


function affirmRender() {
    // lock, darken
    clickEater.classList.add('active', 'block', 'reset');

    const affirmBody = document.getElementById('affirmation');
    // IM TOO DUMB TO KNOW WHAT AN ELEMENT AND A NODE ARE WHY IS THIS HARD
    const affirmSpan = affirmBody.firstChild;

    // Call me beep me if you wanna affirm me
    affirmSpan.innerText = affirmations[getRandomInt(affirmations.length)];

    affirmBody.classList.add('active');
    affirmSpan.addEventListener('animationend', () => {
        // ...what does active do anyway
        //  lol why does it do opacity but not block what was I doing I'm not fixing it
        requestAnimationFrame(() => {
            clickEater.classList.remove('active', 'block', 'reset');
            affirmBody.classList.remove('active');
        });
    }, {once: true});
}


/**
 * Generate new puzzle, setup state to be rendered, request it.
 * Moves state to load for locked render loop
 */
function puzzleCycle() {
    // get new data, jam it in places. Handoff to renderer to loop load and then move to play

    // avoid using -1 as the start idx because I don't want it to break things (but it shouldn't!)
    if (uiState.global !== 'start' && uiState.global !== 'lose') {
        uiState.puzzleid++;
    }

    const [solution_tiles, init_map, moves] = plan_content(puzzles[uiState.puzzleid]);

    uiState.expected_moves = moves;
    if ('move_multiplier' in puzzles[uiState.puzzleid]) {
        uiState.total_moves = Math.round(moves * puzzles[uiState.puzzleid].move_multiplier);
    } else {
        uiState.total_moves = -1;
    }

    // solution_tiles = raw tiles fresh out the oven, send it to the solution region in order
    uiState.current_solution = solution_tiles;

    // this will be our court eunich, scheming from his cage (.tile-base) and devising his tricks
    const puzzle_tiles = []

    // I gotta do something about this variable
    const size = puzzles[uiState.puzzleid].size;
    for (let idx = 0; idx < solution_tiles.length; idx++) {
        const remap_idx = init_map.get(idx);
        const i = Math.floor(remap_idx / size);
        const j = remap_idx % size;
        // GET IN THE DIV
        const base_element = document.createElement('div');
        base_element.classList.add('tile-base');
        base_element.dataset.row = i.toString();
        base_element.dataset.col = j.toString();
        base_element.dataset.index = remap_idx.toString();
        // I can't fiddle with you well enough to reorganize data, just have two copies of the damn board
        // base_element.dataset.start = remap_idx.toString();

        // I have an idea
        base_element.style.gridRow = `${i + 1} / span 1`;
        base_element.style.gridColumn = `${j + 1} / span 1`;

        const puzzle_tile = solution_tiles[idx].cloneNode(true);
        base_element.appendChild(puzzle_tile);

        const overlay = document.createElement('div');
        overlay.classList.add('tile-overlay');

        // I actually only need the one listener on the parent
        // base_element.addEventListener('click', tile_clicked)
        base_element.appendChild(overlay);
        puzzle_tiles.push(base_element);
    }
    uiState.current_board = puzzle_tiles;
    uiState.initial_board = puzzle_tiles.map(item => item.cloneNode(true));

    // webstorm why will you autocomplete when I type uistate but NOT capitalize it for me
    uiState.global = 'load';
    uiState.render.puzzle = true;
    reset_timer();
    uiState.render.timer = true;
    uiState.move = 0;
    uiState.render.moves = true;
    scheduleRender();
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
            move_hist.shift();
        }
        move_hist.push(code);

        // it's modular so there's a max of size-1 moves, but also we don't want 0 moves, so -1 +1
        magnitude = getRandomInt(size - 1) + 1;
        //console.log(code, magnitude)

        // Like I mentioned, wrap around, so if it's past the center the technical solution goes the other way
        if (magnitude <= rollover) {
            actual_moves += magnitude;
        } else {
            actual_moves += size - magnitude;
        }

        // Are our moves sufficiently distributed if we skip the opposite direction?
        //  We cut off the symmetric part so... yes? Ignoring things that approach analyzing the underlying known-bad RNG
        if (vert) {
            // that's... columns
            column_shift(grid, position, magnitude);
        } else {
            // the other one :)
            row_shift(grid, position, magnitude);
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

// ty MDN, I'm sorry Mozilla keeps making just ABSOLUTELY *terrible* business decisions
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

// these ended up being a lot less important than I expected
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
        rotate(grid[idx], !left);
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

// I just can't be bothered to retrofit the grid shifters
//  haha but I can make it call this instead and make it look intentional
function rotate(array, forward = true) {
    if (forward) {
        array.unshift(array.pop());
    } else {
        array.push(array.shift());
    }
}


function color_to_rgb(color_code) {
    const color = parseInt(color_code.slice(1), 16);
    // ... that's BGR
    // return [color & 0xFF, (color & 0xFF00) >> 8, (color & 0xFF0000) >> 16]
    return [(color & 0xFF0000) >> 16, (color & 0xFF00) >> 8, color & 0xFF]
}

function color_is_dark(color_code) {
    // pls I just want a color type.
    const [r, g, b] = color_to_rgb(color_code);
    return (r + g + b) / 3 < 128
}

function invert_style_color(color) {
    if (!color || color.length !== 3) {
        console.warn("Invalid RGB color string:", color);
        return "black"; // Fallback color
    }

    return `rgb(${255 - color[0]}, ${255 - color[1]}, ${255 - color[2]})`;
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


// all my homies hate maps
const colors = {
    // I am good with names!!!
    // https://coolors.co/palette/2f3e77-f5b841-f4ece3-2cb67d-ff4f5e-4ac6ff-ff6a3d
    default: ['#2f3e77', '#f5b841', '#f4ece3', '#2cb67d', '#ff4f5e', '#4ac6ff', '#ff6a3d'],
    // another I like https://coolors.co/palette/f94144-f3722c-f8961e-f9844a-f9c74f-90be6d-43aa8b-4d908e-577590-277da1
    // But I don't care for the 4th and I think the 8 and 9 are too similar to 7 and 10
    //  but I don't like how unbalanced it is if I remove all three
    another_one: ['#f94144', '#f3722c', '#f8961e', '#f9844a', '#f9c74f', '#90be6d', '#43aa8b', '#4d908e', '#577590', '#277da1'],
    // https://coolors.co/palette/001219-005f73-0a9396-94d2bd-e9d8a6-ee9b00-ca6702-bb3e03-ae2012-9b2226
    //  the reds on the end are too similar imho
    another_two: ['#001219', '#005f73', '#0a9396', '#94d2bd', '#e9d8a6', '#ee9b00', '#ca6702', '#bb3e03', '#ae2012', '#9b2226'],
    // https://coolors.co/palette/8ecae6-219ebc-023047-ffb703-fb8500
    // ...is this bluey? also too small
    bluey: ['#8ecae6', '#219ebc', '#023047', '#ffb703', '#fb8500'],
    // https://coolors.co/palette/ef476f-ffd166-06d6a0-118ab2-073b4c
    // too small
    another_three: ["#ef476f", "#ffd166", "#06d6a0", "#118ab2", "#073b4c"],
    // https://coolors.co/palette/264653-2a9d8f-e9c46a-f4a261-e76f51
    four: ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'],
    // there are no good pride ones idk what to tell you, my man.
    // I'm too stupid to use the adobe color wheel!!!
    // I'm paying $5 for coolors for these, if you don't like them I *will* cry
    //  ok actually most of these look terrible I should not have done this
    //  I have immediately failed at something and now I never want to do it again
    // https://coolors.co/palette/d6d2d2-f1e4f3-f4bbd3-f686bd-fe5d9f-364652-071108
    pink: ['#d6d2d2','#f1e4f3','#f4bbd3', '#f686bd', '#fe5d9f', '#364652', '#071108'],
    // https://coolors.co/palette/0d0630-18314f-384e77-8bbeb2-e6f9af-f2dfd7-fef9ff
    five: ['#0d0630', '#18314f', '#384e77', '#8bbeb2', '#e6f9af', '#f2dfd7', '#fef9ff'],
    // https://coolors.co/palette/61a0af-96c9dc-f06c9b-f9b9b7-f5d491-524948-57467b
    six: ['#61a0af', '#96c9dc', '#f06c9b', '#f9b9b7', '#f5d491', '#524948', '#57467b'],
    // https://coolors.co/palette/355070-6d597a-b56576-e56b6f-eaac8b-f5d6c3-fffffa-a9d1dc-53a2be
    seven: ['#355070', '#6d597a', '#b56576', '#e56b6f', '#eaac8b', '#f5d6c3', '#fffffa', '#a9d1dc', '#53a2be'],
    // https://coolors.co/palette/70d6ff-ff70a6-ff9770-ffd670-e9ff70-8db38b-8f2d56-19323c-502274
    eight: ['#70d6ff', '#ff70a6', '#ff9770', '#ffd670', '#e9ff70', '#8db38b', '#8f2d56', '#19323c', '#502274'],
    // https://coolors.co/palette/033f63-28666e-7c9885-b5b682-fedc97-d1d2f9-a3bcf9-ff5a5f-c1839f
    nine: ['#033f63', '#28666e', '#7c9885', '#b5b682', '#fedc97', '#d1d2f9', '#a3bcf9', '#ff5a5f', '#c1839f'],
    // https://coolors.co/palette/227c9d-17c3b2-ffcb77-fef9ef-fe6d73-ffc4eb-ffe4fa-a37774-23231a
    ten: ['#227c9d', '#17c3b2', '#ffcb77', '#fef9ef', '#fe6d73', '#ffc4eb', '#ffe4fa', '#a37774', '#23231a'],
    // https://coolors.co/palette/f94144-f3722c-f8961e-f9c74f-90be6d-43aa8b-227c9d-3e6cb6-564b9d-3e3384
    eleven: ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#90be6d', '#43aa8b', '#227c9d', '#3e6cb6', '#564b9d', '#3e3384'],
    // https://coolors.co/palette/d00000-ffba08-3f88c5-032b43-136f63-713e5a
    twelve: ['#d00000', '#ffba08', '#3f88c5', '#032b43', '#136f63', '#713e5a']
    // TODO: find more I like :(
};

// whitelist of the symbol set to narrow it down
//  also you're gonna want them to not by radially symmetric in any way for certain hell modes
//  ... or maybe you do
const symbols = {
    // like and subscribe
    subscribe: ['youtube', 'hand-thumbs-up', 'sunglasses', 'twitch'],
    // chicken paul
    paul: ['egg', 'fire', 'egg-fried'],
    // "go to the bank and withdraw the funds" - conveniently the size of a 3x3
    //  I like chat-left-text but I feel headset is more appropriate. No office phone icon, tragically.
    withdrawfunds: ['headset', 'chat-left-text', 'car-front', 'bank', 'person-vcard', 'credit-card-2-back',
        'cash-coin', 'currency-exchange', 'currency-bitcoin'],
    // MyCoin is a very real, award-winning financial establishment I'll have you know
    //  VERY tempted to add more copies of award to bias selection
    mycoin: ['currency-exchange', 'cash-coin', 'safe', 'briefcase',
        'currency-bitcoin', 'currency-euro', 'currency-dollar', 'currency-yen', 'currency-rupee', 'currency-pound',
        'buildings', 'bank', 'calculator', 'graph-up-arrow', 'award', 'headset'],
    // Emojos
    emoji: ['emoji-grin', 'emoji-astonished', 'emoji-grimace', 'emoji-smile-upside-down',
        'emoji-wink', 'emoji-kiss', 'emoji-neutral', 'emoji-expressionless', 'emoji-tear', 'emoji-dizzy', 'emoji-frown',
        'emoji-surprise', 'emoji-smile', 'emoji-heart-eyes', 'emoji-laughing', 'emoji-sunglasses', 'emoji-angry'],
    // Dice
    dice: ['dice-1', 'dice-2', 'dice-3', 'dice-4', 'dice-5', 'dice-6'],
    // Numbers
    numbers: ['0-circle', '1-circle', '2-circle', '3-circle', '4-circle', '5-circle', '6-circle', '7-circle',
        '8-circle', '9-circle'],

    // Just a bunch of symbols from the list that are FINE
    default: ['0-circle', '1-circle', '2-circle', '3-circle', '4-circle', '5-circle', '6-circle', '7-circle',
        '8-circle', '9-circle', 'airplane-engines', 'alarm', 'archive', 'arrow-clockwise', 'arrow-counterclockwise',
        'arrow-down-circle', 'arrow-down-left-circle', 'arrow-down-right-circle', 'arrow-left-circle',
        'arrow-left-right', 'arrow-repeat', 'arrow-right-circle', 'arrow-through-heart', 'arrow-up-circle',
        'arrow-up-left-circle', 'arrow-up-right-circle', 'at', 'award', 'backpack2', 'bag', 'balloon', 'bandaid',
        'bank', 'bar-chart-line-fill', 'basket', 'beaker', 'bell', 'bicycle', 'book', 'boombox', 'box-seam', 'bricks',
        'briefcase', 'brush', 'bug', 'building', 'buildings', 'bullseye', 'bus-front', 'cake', 'calculator',
        'calendar2-week', 'camera-reels', 'camera', 'capsule', 'car-front', 'cart4', 'cassette', 'chat-dots',
        'chat-right-text', 'chat-square-quote', 'circle-fill', 'circle-half', 'circle', 'cloud-drizzle', 'cloud-fog2',
        'cloud-hail', 'cloud-haze2', 'cloud-lightning-rain', 'cloud-lightning', 'cloud-moon', 'cloud-rain',
        'cloud-sleet', 'cloud-snow', 'cloud-sun', 'clouds', 'controller', 'credit-card', 'cup-hot', 'cup-straw',
        'currency-bitcoin', 'currency-dollar', 'currency-euro', 'currency-exchange', 'currency-pound', 'currency-rupee',
        'currency-yen', 'diagram-3', 'diamond-fill', 'diamond-half', 'diamond', 'dice-1', 'dice-2', 'dice-3', 'dice-4',
        'dice-5', 'dice-6', 'display', 'door-closed', 'door-open', 'duffle', 'easel', 'egg-fried', 'egg', 'emoji-angry',
        'emoji-astonished', 'emoji-dizzy', 'emoji-expressionless', 'emoji-frown', 'emoji-grimace', 'emoji-grin',
        'emoji-heart-eyes', 'emoji-kiss', 'emoji-laughing', 'emoji-neutral', 'emoji-smile-upside-down', 'emoji-smile',
        'emoji-sunglasses', 'emoji-surprise', 'emoji-tear', 'emoji-wink', 'envelope-at', 'envelope-paper-heart',
        'exclamation-triangle', 'eye-fill', 'fingerprint', 'fire', 'flask', 'floppy', 'folder', 'fork-knife', 'gear',
        'gift', 'graph-down-arrow', 'graph-up-arrow', 'hand-thumbs-down', 'hand-thumbs-up', 'handbag', 'headphones',
        'headset', 'heart', 'heartbreak', 'hospital', 'hourglass-bottom', 'hourglass-split', 'hourglass-top',
        'hourglass', 'house', 'image', 'key', 'keyboard', 'lightbulb', 'link-45deg', 'mailbox-flag', 'mailbox',
        'measuring-cup', 'mic', 'music-note-beamed', 'newspaper', 'paint-bucket', 'paperclip', 'peace', 'pencil',
        'person-raised-hand', 'person-standing-dress', 'person-standing', 'person-walking', 'piggy-bank', 'printer',
        'question-diamond', 'recycle', 'rocket', 'shop', 'sign-stop', 'speedometer', 'stoplights', 'stopwatch',
        'suit-club', 'suit-diamond', 'suit-heart', 'suit-spade', 'trash3', 'tree', 'umbrella', 'volume-down',
        'volume-mute', 'volume-off', 'volume-up', 'watch', 'wifi-1', 'wifi-2', 'wifi-off', 'wifi']
};


/**
 * Array of puzzles to iterate through for challenge
 * See plan_content for primary members
 * Extra features:
 *  @param {number} move_multiplier - Set the move limit to this multiplier of the required moves. Yes you can go lower (rounds down(?))
 *  @param {boolean} spinnnnn - spiiiiiinnnnnnnnnn
 *  @param {string} protect - Enable screen protector 'p' for puzzle, 's' for solution, 'b' for both
 *  @param {string} protect_pattern - Protector theme id, see protectors.svg. Color is baked into the svg, sorry.
 */
const puzzles = [
    {
        size: 2, steps: 1,
        symbol_set: 'paul', exclusive_symbols: true,
        color_set: 'bluey', move_multiplier: 1, rotation: true
    },
    {
        size: 3, steps: 2,
        symbol_set: 'withdrawfunds', exclusive_symbols: true,
        invert_symbol: 'always', rotation: false,
        protect: 's', protect_pattern: 'wavy'
    },
    {
        size: 4, steps: 3,
        image_override: 'wwwwtsactp.png',
        move_multiplier: 3
    },
    {
        size: 1, steps: 1,
        symbol_set: 'emoji', rotation: false,
        protect: 'b', protect_pattern: 'spotlight'
    },
    {
        size: 4, steps: 3,
        symbol_set: 'mycoin', exclusive_symbols: true,
        invert_symbol: 'B&W', rotation: false,
        move_multiplier: 1.75
    },
    {
        size: 10, steps: 1, single_symbol: 'emoji-kiss',
        single_color: '#17c3b2', rotation: false,
        safety: false, nonce: false, move_multiplier: 18749
    },
    {
        size: 5, steps: 1, shuffles: false,
        symbol_set: 'subscribe', exclusive_symbols: true,
        color_set: 'eight', invert_symbol: 'always', rotation: true,
        move_multiplier: 1, spinnnnn: true
    }
];

const affirmations = [
    'You still have moves left!',
    "Real humans don't give up that easy!",
    'You can do it!',

    'Do it for Miller!',
    'Believe in the us that believes in you!',
    'Live Laugh Slide',
    'Object [object]',
    'Have you tried moving it to the left?',
    'Up, maybe?',
    '                                                   Not yet!',
    document.documentElement.innerHTML.replace(/([\r\n])/g, '')
]
// put our thumb on the scale a little bit
affirmations.push(affirmations[0], affirmations[0], affirmations[0], affirmations[0]);


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
 *       but will also interfere with standard generation, so only disable if you want to have fun
 *     Identical tiles will not be interchangeable unless the nonce is off
 * - Always inverting color can look nice at high saturations but may result in poor contrast with some colors.
 *
 * Idea: Reverse-colorblind mode, colors are generated notably close to each other. Maybe a similar rotation mode.
 *
 * @param {number} size - Puzzle size, always square.
 * @param {number} steps - Number of times to slide the initial puzzle rows/columns.
 * @param {number} shuffles - !! Randomly shuffle tiles n times. basically guaranteed to break the puzzle.
 * @param {null|string} image_override - Use an image instead of symbols. Ignores all other settings.
 * @param {string} symbol_set - Symbol set to choose from first (then fallback to default)
 * @param {boolean} exclusive_symbols - !! Only choose from selected symbol set
 * @param {null|string} single_symbol - !! Only use the symbol name provided.
 * @param {string} color_set - Color scheme to pick from.
 * @param {null|string} single_color - !! Only use provided color code for tiles
 * @param {string} invert_symbol - Set symbol stroke to the background's inverse. One of 'always', 'dark', 'B&W', or 'never'
 *  'always' - Fill is the inverse of the background
 *  'dark' - Fill is the inverse of the background is considered "dark enough"
 *      idk what I was doing here, I don't like it very much. Maybe change to literal filter: invert() ?
 *  'B&W' - Fill is black or white depending on tile color
 *  'never' - symbol is presented as-is and fill is not touched.
 * @param {boolean} rotation - Rotate symbols randomly.
 * @param {boolean} safety - Generator safety override.
 * @param {boolean} nonce - Prevents duplicate tiles (prevented by safety) from being interchangeable
 */
function plan_content({size, steps, shuffles = 0,
                      image_override= null,
                      symbol_set= 'emojis', exclusive_symbols = false, single_symbol = null,
                      color_set = 'default', single_color = null, invert_symbol = 'always',
                      rotation = true, safety= true, nonce = true} = {}) {

    if (! (size || steps)) {
        throw new Error('size or steps must be invalid');
    }
    const tiles = [];
    const total_tiles = size * size;

    if (image_override !== null) {
        // This is (clearly!) off by one but it works in all browsers so IDK!
        const fr = 100/(size-1);
        // screw your settings, literally none of them matter
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const tile = document.createElement('div');
                tile.classList.add('puzzle-tile');
                tile.style.backgroundSize = `${size}00% ${size}00%`;
                tile.style.backgroundImage =  `url('${image_override}')`;

                tile.style.backgroundPosition = `${j * fr}% ${i * fr}%`;
                tile.dataset.index = tiles.length.toString();
                tile.dataset.code = tile.dataset.index;

                tiles.push(tile);
            }
        }
    } else {
        if (safety) {
            // oh baby I don't think I've used a ternary in 8 years
            const color_total = single_color ? 1 : colors[color_set].length;
            // Good habits never die
            //  overlap of requested and default set not considered because it's tedious and you're probably fine.
            // BUT!! this also means you *must* have a default set that gets us to the required total
            const symbol_total = single_symbol ? 1 : exclusive_symbols ? symbols[symbol_set].length : symbols.default.length;
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
        const code_set = new Set();

        let color_pool = [];
        let symbol_pool = [];
        const symbols_exhausted = false;
        const only_color = single_color ? single_color : false;
        const only_symbol = single_symbol ? single_symbol : false;

        do {
            // refill color pool
            if (color_pool.length === 0) {
                // shallow copy alert
                // You can't index a map???? why is colors[color_set] undefined
                color_pool = only_color ? [only_color] : Array.from(colors[color_set]);
            }
            // refill symbol pool
            if (symbol_pool.length === 0) {
                // Have I mentioned I've missed ternaries?
                symbol_pool = only_symbol ? [only_symbol] : Array.from(symbols_exhausted ? symbols.default : symbols[symbol_set]);
            }
            const selected_color_idx = getRandomInt(color_pool.length);
            const selected_color = color_pool[selected_color_idx];
            const selected_symbol_idx = getRandomInt(symbol_pool.length);
            const selected_symbol = symbol_pool[selected_symbol_idx];
            const selected_rotation = rotation ? getRandomInt(36) * 10 : 0; // 0 - 350 in increments of 10
            const tile_code = selected_color + '!' + selected_symbol + '!' + selected_rotation;

            // unique tile or we don't care
            if (!code_set.has(tile_code) || !safety) {
                const tile = document.createElement('div');
                tile.classList.add('puzzle-tile');
                tile.style.background = selected_color;

                const symbol = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                if (invert_symbol === 'always' || (invert_symbol === 'dark' && color_is_dark(selected_color))) {
                    const new_color = invert_style_color(color_to_rgb(selected_color));
                    symbol.setAttribute('fill', new_color);
                    // big uh-oh, if something can't do invert they will be invisible lol
                    // I have been informed that invert is resource heavy so go awy
                    // symbol.setAttribute('filter', 'invert(1)');
                } else if (invert_symbol === 'B&W') {
                    if (color_is_dark(selected_color)) {
                        symbol.setAttribute('fill', 'white')
                    } else {
                        symbol.setAttribute('fill', 'black')
                    }
                }
                if (rotation && selected_rotation) {
                    symbol.style.transform = `rotate(${selected_rotation}deg)`;
                    symbol.style.setProperty('--fixed-rotation-angle', `${selected_rotation}deg`);
                }
                // nothing to see here OFFICER
                symbol.style.setProperty('--spin-duration', `${Math.random() * 5}s`);
                symbol.style.setProperty('--spin-direction', Math.random() > 0.5 ? 'normal' : 'reverse');

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
    }

    // ...why do I return the grid anyway, I don't think it has any use.
    const [grid, actual_moves, pos_map] = plan_puzz(size, steps, shuffles)
    return [tiles, pos_map, actual_moves]
}

const puzzleContainer = document.getElementById('puzzle-container');
const solutionContainer = document.getElementById('solution-container');
const captchaContainer = document.getElementById('captcha-container');

// OH IM STILLLL IN A DREEAAAAM
const clickEater = document.getElementById('click-eater');

// you've got enough going on that I'm caching your objects
const humanity = {
    active: true,
    cycle: 0,
    level: 50,

    track: document.getElementById('humanity-track'),
    bar: document.getElementById('humanity'),
    divider: document.getElementById('humanity-divider'),
    human: document.getElementById('human-tile'),
    robot: document.getElementById('robot-tile')
}

/**
 * Tweak humanity bar, never past 6% extremes. Enough small tweaks may trigger a midsize swing.
 *  Large movement always swings in the other direction
 * @param {string} scale - One of 's', 'm', or 'l'
 */
function humanity_adjust(scale) {
    // the got dang rng system doesn't have distributions
    if (humanity.active) {
        let move = getRandomInt(7);
        let recenter = false;
        switch (scale) {
            case 's':
                // +- 10 units
                humanity.cycle += 1;
                if (humanity.cycle > 5 && Math.random() > 0.7) {
                    recenter = true;
                    humanity.cycle = 0;
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
        if ((recenter && humanity.level > 50) || Math.random() > 0.5) {
            move = -move;
        }
        move = Math.max(6, Math.min(94, humanity.level + move));

        humanity.level = move;
        uiState.render.humanity = true;
        scheduleRender();
    }
}
function humanityRender() {
    humanity.bar.style.transform = `scaleX(${humanity.level}%)`;

    // THIS IS STUPID! my border scales with the object so I have to glue on another item.
    // if I use ::after, it gets sucked into scaling somehow, so it has to be individually controlled
    humanity.divider.style.transform = `translateX(-${humanity.track.getBoundingClientRect().width * (1 - (humanity.level / 100)) + 4}px)`;

    humanity.human.classList.remove('alert');
    humanity.robot.classList.remove('alert');
    //void humanity_human.offsetWidth;
    //void humanity_robot.offsetWidth;
    if (humanity.level > 70) {
        humanity.robot.classList.add('alert');
    } else if (humanity.level < 25) {
        humanity.human.classList.add('alert');
    }
}
function humanityLoop() {
    // 2 - 5s
    setTimeout(() => {humanity_adjust('s'); humanityLoop()}, ((Math.random() * 3) + 2)*1000);
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

function infoRender() {
    const info_items = document.getElementsByClassName('info-panel');
    const id_items = document.getElementsByClassName('container-id');

    if (!uiState.info) {
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
    uiState.info = !uiState.info;
}

function register_info() {
    const info_button = document.getElementById('control-1');
    info_button.addEventListener('click', (event) => {
        event.stopPropagation(); // ?? who else could have this event
        uiState.render.info = true;
        scheduleRender();
    });

    clickEater.addEventListener('click', () => {
        if (uiState.info) {
            // move to start state, ask for the quit flag to fly up.
            if (uiState.global === 'info') {
                uiState.global = 'start';
                uiState.render.quit = true;
            }
            uiState.render.info = true;
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
    const progressContainer = document.getElementById('addon-progress');
    if (progressContainer.childElementCount === 0) { // aka we're empty aka global info-init state
        const empty_tile = document.createElement('div');
        empty_tile.classList.add('tile-base');
        const empty_symbol = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        empty_symbol.innerHTML = `<use xlink:href="bootstrap-icons.svg#${progress_shape}"/>`;
        empty_tile.append(empty_symbol);

        for (let i = 0; i < puzzles.length; i++) {
            progressContainer.appendChild(empty_tile.cloneNode(true));
        }
        return;
    }

    // ok, we were asked for an update for *SOME REASON*
    const target_element = progressContainer.children[uiState.puzzleid];

    const final_svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    switch (uiState.global) {
        // ...can I put code here (no)
        case 'play':
            // started play on current puzzle idx, partial fill
            final_svg.innerHTML = `<use xlink:href="bootstrap-icons.svg#${progress_shape}-half"/>`;
            break
        case 'win':
            // gg no re, fill
            final_svg.innerHTML = `<use xlink:href="bootstrap-icons.svg#${progress_shape}-fill"/>`;
            break
        case 'lose':
            // lmao get owned
            final_svg.innerHTML = `<use xlink:href="bootstrap-icons.svg#${progress_shape}"/>`;
            break
        default:
            // idk how you got here; please do not touch anything
            return;
    }
    target_element.classList.add('flip');
    target_element.addEventListener('transitionend', function handler() {
        // I'm told I should wipe the transitionend listener to kill any others also running BUUUT.. chaos reigns
        target_element.replaceChildren(final_svg);
        // I'm also told I shoudl jame it in a frame so the browser has a better chance of noticing the state change
        //  I can do that.
        requestAnimationFrame(() => {target_element.classList.remove('flip');});
    });
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
        humanityLoop();
        register_arrows();
        // idk where else to put you
        puzzleContainer.addEventListener('click', tile_clicked);
    }
}

function inject_debug() {
    // TODO: unhook overflow on main div, glue on a panel to control puzzle zero settings
    //  that's effort, get owned, death stranding 2 is out
}


function tile_clicked(event) {
    // on click, highlight the row/col, lowlight the others.
    //  when clicking the already selected tile, clear everything.
    const base = event.target.closest('.tile-base');
    if (!base) {
        // You didn't click a tile, skill issue.
        return;
    }
    if (uiState.active_tile === base) {
        // kill the lights
        uiState.active_tile = null;
    }
    else {
        // highlight/lowlight
        uiState.active_tile = base;
    }
    uiState.render.relight = true;
    scheduleRender();
}

function relightRender() {

    /*
    // ????? I have clickeater.reset
    // short circuit lose state to kill the lights.
    //  a render request post win/loss will reset the lights by accident - handy!
    if (uiState.global === 'lose') {
        uiState.current_board.forEach((item) => {
            const overlay = item.querySelector('.tile-overlay');
            overlay.classList.remove('highlighted', 'active-tile');
            overlay.classList.add('lowlighted');
        });
        return;
    }
    */

    if (uiState.active_tile !== null) {
        uiState.current_board.forEach((base) => {
            const overlay = base.querySelector('.tile-overlay');
            overlay.classList.remove('highlighted', 'lowlighted', 'active-tile');
            if (base.dataset.row === uiState.active_tile.dataset.row ||
                base.dataset.col === uiState.active_tile.dataset.col) {
                overlay.classList.add('highlighted');
                if (base === uiState.active_tile) {
                    overlay.classList.add('active-tile');
                }
            } else {
                overlay.classList.add('lowlighted');
            }
        });
    } else {
        uiState.current_board.forEach((item) => {
            const overlay = item.querySelector('.tile-overlay');
            overlay.classList.remove('highlighted', 'lowlighted', 'active-tile');
        });
    }
}


function slideRender() {
    const slide_overlay = document.getElementById('slide-overlay')
    // suck up current state
    const size = puzzles[uiState.puzzleid].size;
    const direction = uiState.render.slide_direction;
    uiState.render.slide_direction = null;
    const vert = direction === 'u' || direction === 'd';

    // pull out row/col that is moving before reorg
    const active_row = [...puzzleContainer.querySelectorAll(
        vert ? `[data-col="${uiState.active_tile.dataset.col}"]` : `[data-row="${uiState.active_tile.dataset.row}"]`)];

    // nothing mentions a guarantee about result ordering AND our children are all jumbled (get a load of this society)
    active_row.sort((a, b) => vert ? Number(a.dataset.row) - Number(b.dataset.row) : Number(a.dataset.col) - Number(b.dataset.col))

    // ... by reorganizing the backing data we screwed up the execution order w/ the renderer
    //  which causes the render plan to be off by one tile
    //   so patch it by feeding it an out of date copy of the row
    // lol lol websites are stupid get owned if I clone the node to animate it in the renderer
    //  the tiles no longer have dimensions because they're copes so they aren't rendered lol get owned
    // so it has to be done *here* and *now* and we have to jam post-reorg in the frame

    // OH MY GOD I CAN PULL THE LOCATIONS FROM THE TILES PHEW
    clickEater.classList.add('block'); // this should be up already but let's be safe
    slide_overlay.innerHTML = '';
    slide_overlay.classList.add('active');

    const overlay_rect = slide_overlay.getBoundingClientRect();

    for (let i = 0; i < size; i++) {
        const slide_copy = active_row[i].cloneNode(true);
        const tile_rect = active_row[i].getBoundingClientRect();

        // GET OUT :)
        slide_copy.style.cssText = '';
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
    let tx = 'idk im dumb!';
    if (vert) {
        const tile_rect = active_row.at(direction === 'u' ? -1 : 0).getBoundingClientRect();
        slide_copy.style.left = `${tile_rect.left - overlay_rect.left}px`;
        if (direction === 'u') {
            slide_copy.style.top = `${tile_rect.bottom - overlay_rect.top}px`;
            tx = `translateY(-${tile_rect.height}px)`
        } else {
            // no I don't know why it shouldn't have an offset but it works.
            slide_copy.style.top = `-${tile_rect.height}px`;
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
            // idk!!!
            slide_copy.style.left = `-${tile_rect.width}px`;
            tx = `translateX(${tile_rect.width}px)`
        }
    }
    slide_copy.style.position = 'absolute';
    slide_copy.style.display = 'block';
    slide_copy.style.width = `${active_row[0].offsetWidth}px`;
    slide_copy.style.height = `${active_row[0].offsetHeight}px`;
    slide_overlay.appendChild(slide_copy);
    // HAVE to force reflow because this object starts in the overflow
    //  the others don't seem to need it
    void slide_copy.offsetHeight;
    for (const child of slide_overlay.children) {
        child.style.transform = tx;
    }

    slide_overlay.firstChild.addEventListener('transitionend', () => {
        requestAnimationFrame(() => {
            slide_overlay.innerHTML = ''; // get blasted
            slide_overlay.style.transform = ''; // just to be clean
            slide_overlay.classList.remove('active');
            clickEater.classList.remove('block');
            checkMove();
        })
    }, {once: true});

    uiState.render.relight = true;
    // NAH, render queue order.
    //scheduleRender();

    // archive data copy to stamp on top of the reorganized data
    //  (whoops, dataset obj not enough (technically it is but I don't wanna reapply styles)
    const dataclone = active_row.map(item => item.cloneNode(true));

    // scramble it
    rotate(active_row, direction === 'd' || direction === 'r');

    // stamp the POSITIONAL data on top of the tiles
    for (let i = 0; i < active_row.length; i++) {
        // ...ok the only data on these puppies is the positional data
        // OBJECTS ARE STUPID you can't just assign the datasets and styles over
        //active_row[i].dataset = dataclone[i].dataset;
        Object.assign(active_row[i].dataset, dataclone[i].dataset);
        //active_row[i].style = dataclone[i].style;
        active_row[i].style.cssText = dataclone[i].style.cssText;
    }
}

function checkMove() {
    //  1: Check you won.
    //  2. Check you two (lost).
    //  3. I don't think there's a 3?
    //
    // /!\ this is called inside the anim frame at the end of the move's transition
    //  so it's safe to fiddle around

    // Well I baked in a secret quick check because each base knows who it is and each puzzle tile knows where it goes
    // but this isn't nonce-able
    //const won = uiState.current_board.every((elem) => elem.dataset.index === elem.firstElementChild.dataset.index);
    let won = true;
    for (let i = 0; won && i < uiState.current_board.length; i++) {
        // where did you go why am I punished for making things look nice
        const tile = puzzleContainer.querySelector(`.tile-base[data-index="${i}"]`);
        won &= tile.firstElementChild.dataset.code === solutionContainer.children[i].dataset.code
    }

    // lol 10% chance to return on lose instead of killing?

    if (won || (uiState.total_moves !== -1 && uiState.move >= uiState.total_moves)) {
        // kill timer - stop will call a final render
        stop_timer();

        // I want to get off mr bones wild ride
        clear_protectors()

        // technically it could be *gasp* off for a frame or so otherwise
        clickEater.classList.add('active', 'block');

        // we won... or not.
        // ... actually we do kinda have to hit the start state so these are in the way
        uiState.global = won ? 'win' : 'lose';

        if (!won) {
            // owned, owned, lose 80% to full and lose your cycle swing progress
            humanity.level += Math.ceil(0.8 * (100 - humanity.level))
            humanity.cycle = 0;
            uiState.render.puzzle = true; // Mods, unload his tiles
        } else {
            // congrats I guess, not like it was hard or whatever
            humanity.level -= Math.floor(0.2 * (100 - humanity.level))
        }

        uiState.render.humanity = true;

        // lock the ui up with a quit gate
        uiState.render.quit = true;
        // This got a little too complex so it has an extra lose state
        uiState.quit =  won ? uiState.puzzleid === puzzles.length - 1 ? 'exit' : 'start' : 'lose';
        uiState.render.moves = true;
        uiState.active_tile = null;
        uiState.render.relight = true;
        uiState.render.progress = true;
        scheduleRender();
    }
}

function register_arrows() {
    const up = document.getElementById('control-2');
    const down = document.getElementById('control-8');
    const left = document.getElementById('control-4');
    const right = document.getElementById('control-6');

    function arrowhandler(event, direction) {
        if (uiState.active_tile === null) {
            return; // why do you waste my time like this
        }
        // lock up the ui instantly, it's also invisible and one change so screw frames and the renderer
        clickEater.classList.add('block'); // blocked but not active, no click events probably.
        uiState.move++;
        uiState.render.moves = true;
        uiState.render.slide = true;
        uiState.render.slide_direction = direction;
        scheduleRender();
    }

    up.addEventListener('click', (event) => {
        humanity_adjust('s'); // tee hee
        arrowhandler(event, 'u');
    });
    down.addEventListener('click', (event) => {
        humanity_adjust('s');
        arrowhandler(event, 'd');
    });
    left.addEventListener('click', (event) => {
        humanity_adjust('s');
        arrowhandler(event, 'l');
    });
    right.addEventListener('click', (event) => {
        humanity_adjust('s');
        arrowhandler(event, 'r');
    });
}



async function protectorInjector() {
    // TURNS OUT SAFARI IS BAD AT SVGS
    //  it can't fetch files with a fill url. Chrome can, of course.
    // and you can't just suck up an svg like
    const resp = await fetch('protectors.svg');
    if (!resp.ok) {
        // I genuinely don't know what to do
        throw new Error('Protector pull ate it!')
    }
    const svg = await resp.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    const defs = doc.querySelector('defs');

    const protector = document.getElementById('protector-svgs');

    if (defs) {
        while (defs.firstChild) {
            protector.appendChild(defs.firstChild);
        }
    }
}


function clear_protectors() {
    // idk why I made this a function
    if (uiState.render.protector !== null) {
        clearTimeout(uiState.render.protector);
        uiState.render.protector = null;
        document.querySelectorAll('.protector').forEach((el) => {
            el.classList.remove('active');
            const rect = el.querySelector('rect');
            rect.style.transition = `transform 0.3s ease-in-out`;
            rect.style.transform = `translate(0px, 0px) rotate(0deg)`;
        })
    }
}

function set_protectors(reset=false) {
    // This is a pain because safari HATES FUN
    // also hoooo buddy this gets a little framey with both on. SAFARI THIS IS ALL YOUR FAULT.
    if (reset && uiState.render.protector != null) {
        clearTimeout(uiState.render.protector);
        uiState.render.protector = null;
    }

    if (uiState.render.can_protect && puzzles[uiState.puzzleid].protect != null) {
        let sel = '.protector'
        if (puzzles[uiState.puzzleid].protect === 'p') {
            sel = '#puzzle-protector';
        } else if (puzzles[uiState.puzzleid].protect === 's') {
            sel = '#solution-protector';
        }
        // turn on the protectors then find the actual rect elements
        let protectors = document.querySelectorAll(sel);
        protectors.forEach(protector => {protector.classList.add('active')});
        // what do you mean there isn't a map function I hate these stupid objects
        //  THERE IS ONE NOW >:C
        protectors = [...protectors].map(protector => protector.querySelector('rect'))

        const pattern = puzzles[uiState.puzzleid].protect_pattern == null ? 'wavy' : puzzles[uiState.puzzleid].protect_pattern
        protectors.forEach(protector => {protector.setAttribute('fill', `url(#${pattern})`)})

        // finally, being a professional shape rotator pays off
        // 400x inside a 100x, the most extreme movement needs to leave sqrt(2)100 sooo 142px from edge
        //  that's +-58 px of transform room. That's a lot less than I had hoped.
        //  there's a hair more space judging by throwing things around manually in the console but let's not go crazy.
        //   maybe some padding/broder artifacts?
        // Get increased, call our border 150px, give me +-75, that's 225 that's 450. centering that is UHHHH -175
        //  I want you getting seasick off this.

        // now, the spotlight is a whole other beast because that's math and that sucks.
        //  that's rendered at a 1:1 scale with a radius of 15 units which are probably pixels
        // give it a little wiggle room to go off the edge a bit that's +-40
        // I simply cannot be bothered to do angle math. I want the dvd bounce SO BAD but I just don't wanna
        //  Well something is off about that math and idk why. Knock it down 10.

        const maxOffset = pattern === 'spotlight' ? 36 : 75;
        const maxAngle = 45;
        // I gotta
        const minDelay = pattern === 'spotlight' ? 2000 : 10000;

        function jostleRects() {
            let newX = 0;
            let newY = 0;
            let newA = 0;

            // 10-14s
            const nextJostle = Math.trunc(minDelay + (Math.random() * 4000));
            console.log(nextJostle);

            requestAnimationFrame(() => {
                protectors.forEach(protector => {
                    newX = (Math.random() * 2 - 1) * maxOffset;
                    newY = (Math.random() * 2 - 1) * maxOffset;
                    newA = (Math.random() * 2 - 1) * maxAngle;

                    // all this rotatin's hell on my knees boss
                    protector.style.transition = `transform ${nextJostle}ms ease-in-out`;
                    if (pattern === 'spotlight') {
                        // try to save a few resources
                        protector.style.transform = `translate(${newX}px, ${newY}px)`;
                    } else {
                        protector.style.transform = `translate(${newX}px, ${newY}px) rotate(${newA}deg)`;
                    }
                })
                uiState.render.protector = setTimeout(jostleRects, nextJostle);
            });
        }
        // lol no initial jostle, you get 10 seconds. No, half. No, less
        uiState.render.protector = setTimeout(jostleRects, reset ? 0 : 2000 + (Math.random() * 1000))
    }
}
