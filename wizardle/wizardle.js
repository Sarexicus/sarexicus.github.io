// WIZARDLE

var spellOptions = document.getElementById("spells");
var spellInput = document.getElementById("spellInput");
var spellSubmit = document.getElementById("spellSubmit");

var body = document.body;

var spElements = [];
var currentGuessIndex = 0;
var spellToGuess = {};

var outputEmoji = "";
var outputEmojiSpoilers = "";

var local_progress_today = 
{
    date: new Date().toJSON(),
    guesses: []
};

function load_save_storage()
{
    var storedNames = JSON.parse(localStorage.getItem("darkvision"));
    if(storedNames)
    {
        set_darkvision(storedNames);
    }

    // var localProg = JSON.parse(localStorage.getItem("local_progress"));
    // local_progress_today = localProg;
    // if(localProg)
    // {
    //     if(localProg.date)
    //     {
    //         if(localProg.date === new Date().getDate())
    //         {
    //             localProg.guesses.forEach(guess => {
    //                 find_spell(guess);
    //             });
    //         }
    //     }
    // }
}

function save_local_progress()
{
    localStorage.setItem("local_progress", JSON.stringify(local_progress_today));
}

var darkvision = undefined;
load_save_storage();

// suggested spell list
let spell_list = [];
fetch("./wizardle/5e_spells.json")
    .then(res => res.json())
    .then(out => {
        spell_list = out;
        spell_list.forEach(element => {
            const node = document.createElement("option");
            node.setAttribute("value", element.Name);
            spellOptions.appendChild(node);
        });
        initialise();
    });



var randomSpell = {};
function initialise()
{
    // randomise!
    var date = new Date();
    var seed = new Math.seedrandom(date.getYear()+date.getMonth()+date.getDay());
    // seed = new Math.seedrandom(Math.random())
    randomSpell = Math.floor(seed() * spell_list.length);

    spellToGuess = spell_list[randomSpell];
    // console.log(spellToGuess);

    create_squares()
}

function toggle_darkvision()
{
    set_darkvision(!darkvision);
}

function set_darkvision(value)
{
    darkvision = value;
    localStorage.setItem("darkvision", JSON.stringify(value));
    if(value)
    {
        body.classList.add("nightmode");
    }
    else
    {
        body.classList.remove("nightmode");
    }
}

function create_squares()
{
    const gameBoard = document.getElementById("board");
    let max_guesses = 7;

    for(var i = 0; i < max_guesses * 6; i++)
    {
        if(i % 6 == 0)
        {
            let guess = document.createElement("div");
            guess.classList.add("sqGuess");
            gameBoard.appendChild(guess);

            var el = [guess];
            
            spElements.push(el);
            continue;
        }
        let square = document.createElement("div");
        square.classList.add("square");
        square.setAttribute("id", "square" + (i+1))
        gameBoard.appendChild(square);
        spElements[spElements.length-1].push(square);
    }
}

function do_a_flip(element)
{
    element.classList.add("flip");
}

function set_correctness(delay, element, correct, close, number = false, higher = false)
{
    // flip the element
    setTimeout(function() { do_a_flip(element) }, delay);

    if(correct)
    {
        element.classList.add("correct");
        add_to_emoji("🟩");
        return;
    }

    if(close)
    {
        element.classList.add("close");

        if(number)
        {
            if(higher)
            {
                element.classList.add("higher");
                add_to_emoji("🔼");
            }
            else
            {
                element.classList.add("lower");  
                add_to_emoji("🔽");
            } 
        }
        else
        {
            add_to_emoji("🟨");
        }

        return;
    }

    element.classList.add("nope");
    add_to_emoji("⬛");
}

// https://stackoverflow.com/a/11909592
function getSeconds(str) {
    var seconds = 0;
    var days = str.match(/(\d+)\s*[dD]/);
    var hours = str.match(/(\d+)\s*[hH]/);
    var minutes = str.match(/(\d+)\s*[mM]/);
    var rounds = str.match(/(\d+)\s*[rR]/);
    if (days) { seconds += parseInt(days[1])*86400; }
    if (hours) { seconds += parseInt(hours[1])*3600; }
    if (minutes) { seconds += parseInt(minutes[1])*60; }
    if (rounds) { seconds += parseInt(rounds[1])*6; }
    return seconds;
}

function parse_spell_level(delay, element, level, reference)
{
    element.innerText = (level === 0) ? "Cantrip" : level;

    set_correctness(delay, element, level == reference, level != reference, true, level < reference);
}

function parse_duration(delay, element, duration, reference)
{
    element.innerText = duration;

    var len = find_time_from_string(duration);
    var complen = find_time_from_string(reference);

    set_correctness(delay, element, len == complen, len != complen, true, len < complen);
}

function parse_components(delay, element, components, reference)
{
    var subset = (reference.includes(components));
    var commad = components.replace(/.{1}/g, '$&, ').slice(0,-2);

    var equal = components === reference; 

    element.innerText = commad;
    set_correctness(delay, element, equal, subset, false, false);

}

function parse_concentration(delay, element, conc, ref)
{
    var comp = (conc === ref);

    element.innerText = (conc) ? "✅" : "❌";
    set_correctness(delay, element, comp, false, false, false);
}

function find_time_from_string(timestring)
{
    if(timestring.includes("Instantaneous")) return 0;
    if(timestring.includes("Until Dispelled")) return Infinity;

    var st = timestring;
    return getSeconds(st);
}

function add_to_emoji(str)
{
    outputEmoji += str;
    outputEmojiSpoilers += str;
}

function determine_correctness(delay, element, value, reference, number = false)
{
    element.innerText = value;
    // flip the element
    setTimeout(function() { do_a_flip(element) }, delay);

    if(value == reference)
    {
        element.classList.add("correct");
        add_to_emoji("🟩");
        return;
    }

    if(number)
    {    
        element.classList.add("close");
        if(parseInt(value) < parseInt(reference))
        {
            element.classList.add("higher");
            add_to_emoji("🔼");
        }
        else
        {
            element.classList.add("lower");  
            add_to_emoji("🔽");
        } 
    }
    else 
    {
        element.classList.add("nope");
        add_to_emoji("⬛");
    }
}

function make_guess(event)
{
    event.preventDefault();
    var inp = spellInput.value

    // clear the input field
    spellInput.value = ""

    find_spell(inp, true);
}

function find_spell(inp, save = false)
{
    inp = inp.toLowerCase().trim();

    var result = spell_list.find(obj => {
        return obj.Name.toLowerCase().trim() === inp
    });

    if(result === undefined)
    {
        return;
    }

    if(save) 
    {
        save_local_progress();
        local_progress_today.guesses.push(inp);
    }
    calculate_guess(result);
}

function calculate_guess(result) {

    spElements[currentGuessIndex][0].innerText = result.Name;
    spElements[currentGuessIndex][0].classList.add("glow");


    parse_spell_level(0,spElements[currentGuessIndex][1], result.Level, spellToGuess.Level, true);
    determine_correctness(100,spElements[currentGuessIndex][2], result.School, spellToGuess.School);

    parse_duration(200, spElements[currentGuessIndex][3], result.Duration, spellToGuess.Duration);
    parse_concentration(300,spElements[currentGuessIndex][4], result.Concentration, spellToGuess.Concentration);
    parse_components(400,spElements[currentGuessIndex][5], result.Components, spellToGuess.Components);

    outputEmojiSpoilers += "||`" + result.Name + "`||" + "\n";
    outputEmoji += "\n";

    win_condition(result);

    currentGuessIndex ++;

    // console.log(result);

}

function compare_elements(result)
{
    var a = result, b = spellToGuess;
    if(a.Components === b.Components && a.Concentration === b.Concentration 
        && a.Duration === b.Duration && a.Level === b.Level && a.School === b.School)
    {
        spellToGuess = result;
        return true;
    }

    return false;
}

function win_condition(result)
{
    if(compare_elements(result))
    {
        document.getElementById("spellInput").disabled = true;
        document.getElementById("spellSubmit").disabled = true;
        spElements[currentGuessIndex].forEach(element => {
            setTimeout(function() { do_a_dance(element) }, 1000);
            setTimeout(function() { game_over(true) }, 1000);
        }); 
    }

    if(currentGuessIndex == 6)
    {
        game_over(false);
    }
}

function do_a_dance(element)
{
    element.classList.add("correct-guess");
}

function game_over(win)
{
    document.getElementById("spellInput").style.display = "none";
    document.getElementById("spellSubmit").style.display = "none";
    document.getElementById("spellResult").style.display = "block";
    document.getElementById("spellResult").innerText = spellToGuess.Name;
    generate_share_link();
}

function generate_share_link()
{
    document.getElementById("shareContainer").style.visibility = "visible"; 

    document.getElementById("shareEmoji").innerText = outputEmoji;
}

// https://stackoverflow.com/a/29774197
function get_date()
{
    let yourDate = new Date();
    const offset = yourDate.getTimezoneOffset()
    yourDate = new Date(yourDate.getTime() - (offset*60*1000))
    return yourDate.toISOString().split('T')[0]
}

function copy_to_clipboard(discord)
{
    var decor = "Wizardle " + get_date() + " " + (currentGuessIndex).toString() + "/7";

    decor += "\n\n" + ((discord) ? outputEmojiSpoilers : outputEmoji);
    decor += "https://sarexicus.github.io/wizardle";

    var element = (discord) ? document.getElementById("copy-discord") : document.getElementById("copy-straight") 
    element.innerText = "(Copied!)";

    navigator.clipboard.writeText(decor);
}

spellSubmit.addEventListener("click", function (event) {
    make_guess(event);
});
spellInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        make_guess(event);
    }
}); 

// Get the modal
var modal = document.getElementById("help-modal-container");

// Get the button that opens the modal
var btn = document.getElementById("help-button");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close-button")[0];

// When the user clicks on the button, open the modal
btn.onclick = function() {
    modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
} 