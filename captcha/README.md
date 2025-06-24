# Slidecha
It's a sliding puzzle, it's a captcha!

The primary design goal is to be more or less believable while providing enough bells and whistles to cause chaos.
Time to solve can be quickly tweaked to range from a few moments to hours to literally impossible.

Unlike a more traditional sliding puzzle where you move a single tile, here you move entire rows or columns of tiles with wraparound.

The puzzle starts by first displaying the goal and some descriptive information.
The UI is divided into four sections across two halves; the left side contains the current puzzle and addons, and the right contains the solution and controls.
The user selects a tile and can then click a control arrow to move the appropriate pieces.
This either repeats until the user solves the puzzle or, if enabled, they run out of moves.
If the user solves the puzzle, it moves to the next puzzle if there are any or fires a solve event.
If the user loses, a new puzzle is generated using the current puzzle plan.

There are four extra control buttons:
1. Info - Displays starting info text again
2. Reset - Reverts current puzzle to the starting state. Note that it does *not* refund spent moves
3. Quit/New/Exit - Generates a new puzzle if the user wins or loses or submits a solve event.
   1. The user is offered the chance to generate a new puzzle at any time. This is a trap and the UI will lock while it displays an encouraging message.
4. Flip - This simply flips the position of the puzzle and the solution windows as one is larger than the other.

The addon section contains 5 components:
1. Puzzle progress - This shows the user how many puzzles they have completed.
2. Humanity - A semi-random random slider that rates the system's confidence that the user is not a robot. A light blinks when it gets to either extreme.
   1. It follows a cycle of randomly timed adjustments eventually ending in a larger swing towards the other side.
   Interacting with the arrow controls advances the cycle.
   Losing a puzzle reduces their score by 80% of its current value; a win increases it by 20%.
3. Time spent - It goes up! Cuts of at 99:99:99.
   1. Accuracy is only to one second due to poor Safari performance of 100ms callback and paint.
4. Move - Current move count and move limit (if configured).
5. Affirmation - The user's motivational message will unfurl and scroll over the addon panel.

Detailed configuration documentation is in the code and follows:
* Tile icons are in the `symbols` variable, these are divided into sets a puzzle can select from.
  * Symbols must be in the (included) bootstrap icon library. See `main.js:46`, `plan_content` for the `use` template in order to change this.
* Tile colors are in the `colors` variable, also divided into sets.
* The user affirmations, `affirmations` is a list of strings.
* Puzzle definitions are set in `puzzles`. See the function `plan_content` docs for normal generation settings. See the variable docs for the fun settings.
* The amount of time it takes to scroll tiles is in the CSS (`--slide-timing`).
* The affirmation lockout and text scroll is also in the CSS (`--affirmation-time`).
* Reskinning colors likely annoying, but you're looking for `lightgray` in the CSS, with a bit of `darkgray`.
The default puzzle set is designed to run you through examples of what is possible without any being too difficult.


### General puzzle creation

Puzzles should at the very least define their size and the number of movement steps.
From there they can be further decorated by choosing a custom color set, set of symbols, or an image.

Additional settings let you further lock in your configuration.
Symbol color inversion is a nice touch, though some colors can look questionable.
Setting it to `B&W` is a great default unless you're experimenting with colored images.
By default, symbols will be randomly rotated, which also gives them a good "captcha" feeling.

The following are the parameters in `puzzles` that are fed to `plan_content`:
* @param {number} `size` - Puzzle size, always square.
* @param {number} `steps` - Number of times to slide the initial puzzle rows/columns. Idk what happens <= 0
* @param {number} `shuffles` - !! Randomly shuffle tiles n times. Basically guaranteed to break the puzzle.
* @param {null|string} `image_override` - Use an image instead of symbols. Ignores all other settings.
* @param {string} `symbol_set` - Symbol set to choose from first (then fallback to default)
* @param {boolean} `exclusive_symbols` - !! Only choose from selected symbol set
* @param {null|string} `single_symbol` - !! Only use the symbol name provided.
* @param {string} `color_set` - Color scheme to pick from.
* @param {null|string} `single_color` - !! Only use provided color code for tiles
* @param {string} `invert_symbol` - Set symbol stroke to the background's inverse. One of 'always', 'dark', 'B&W', or 'never'
  * `always` - Fill is the inverse of the background
  * `dark` - Fill is the inverse of the background is considered "dark enough" - idk why I made this it's kinda ugly
  * `B&W` - Fill is black or white depending on tile darkness
  * `never` - Symbol is presented as-is and fill is not touched.
* @param {boolean} `rotation` - Rotate symbols randomly in 10 degree increments
* @param {boolean} `safety` - Generator safety override.
* @param {boolean} `nonce` - Prevents duplicate tiles (also prevented by safety) from being interchangeable

The number of steps is not the number of moves to solution; generation may undo its own steps or create something reducible.
Moves range from (roughly) `steps` to `floor(size/2)*shifts`

Options that can break things are marked with exclamation points.
I accidentally created a definition that didn't have enough variation, the game continued after a UI hiccup.
It will likely lock up if it's the last puzzle that fails.
The progress meter will skip a step.

The tile generator is only smart during its first pass (the first `min(symbols.length, colors.length, rotation ? 36 : Inf)` tiles).
If your total number of possible combinations is close to the number of tiles, it could get stuck trying to randomly pick combinations that haven't been done yet.

You can turn off the safety check and it will spit out whatever it wants.
Identical tiles will secretly be considered different unless you disable the nonce system.

### Extra puzzle settings:

The move multiplier is vital to give your puzzle a constrained feel.
A funny side effect to consider is that it's impossible to lose when you have unlimited moves, meaning the user can never swap out the puzzle they are given.
Take that as you will.

The protector is a great addition that applies an overlay over one or both tile grids reminiscent of traditional text captchas.

These are directly set in the `puzzles` object and picked up by various functions as needed:
* @param {number} `move_multiplier` - Set the move limit to this multiplier of the required moves.
  * Yes you can go lower. Win/loss is only checked after making a move so you always get one.
* @param {number} `tile_time` - Time between tile loads, in milliseconds
* @param {boolean} `spinnnnn` - Take it for a spin and find out. Probably not practical, but it *was* easy!
* @param {string} `protect` - Enable the screen protector. 'p' for puzzle, 's' for solution, 'b' for both.
* @param {string} `protect_pattern` - Protector theme id, see `protectors.svg`. Defaults to `wavy` if enabled.
  * Content and color is strictly controlled by the SVG def, unfortunately. Safari made this almost impossible. Great place for a brand identifier, see code for sizing info.
  * Motion can't be disabled but it can easily be broken off by removing the bottom half of `set_protectors` or just commenting out the jostle callback.


## Cut content:
### Friend
He's your friend! Maybe it's a rating? Either way, he's there!

Emoji that randomly cycles when the user makes a move.
Permanently dies when a puzzle is lost.
Cut for time and lack of space in lower addon bar.
Could go in the center of the control panel or replace the flip button.

### Emergency verification
The robot blinks for a reason!

Your HumanRank has gone too low for too long, please complete an additional captcha to continue.

### Other things I'm sure
The tragedy of digital notes is that you can delete them so easily when you're done.
