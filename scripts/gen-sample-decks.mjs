// One-off generator for extra sample decks (not part of the running app —
// run manually, writes validated CSVs into data/). Not wired into npm scripts;
// delete or keep as a reference for adding future decks the same way.
import { writeFileSync } from "node:fs";
import { cardsToCsv, parseAndValidateCsv } from "../csv.js";

function card(concept, letter, clue, d1, d2, category) {
  return { concept, letter, clue, distractors: [d1, d2], category };
}

const microbit = [
  card("LED", "L", "What L is a tiny light on the micro:bit's 5x5 grid used to display patterns and text?", "Loudspeaker", "Lithium battery", "micro:bit"),
  card("Button", "B", "What B is a physical input labelled A or B that you can press on the micro:bit?", "Bluetooth", "Battery", "micro:bit"),
  card("Radio", "R", "What R is a wireless communication mode used to send simple messages between micro:bits?", "Resistor", "RGB sensor", "micro:bit"),
  card("Accelerometer", "A", "What A is the built-in sensor that detects shaking, tilting and free-fall?", "Antenna", "Algorithm", "micro:bit"),
  card("Compass", "C", "What C is the built-in sensor that detects magnetic north and needs calibration before first use?", "CPU", "Capacitor", "micro:bit"),
  card("MakeCode", "M", "What M is the block-based drag-and-drop editor commonly used to program the micro:bit?", "Microphone", "Motor", "micro:bit"),
  card("Python", "P", "What P is the text-based programming language you can also use to code the micro:bit?", "Pin", "Processor", "micro:bit"),
  card("GPIO", "G", "What G is the group of general-purpose input/output pins along the edge connector?", "Gyroscope", "Grid", "micro:bit"),
  card("Simulator", "S", "What S lets you test your micro:bit code in a browser before flashing it to a real device?", "Speaker", "Sensor", "micro:bit"),
  card("Flash", "F", "What F is the act of transferring your compiled program onto the micro:bit over USB?", "Firmware", "Function", "micro:bit"),
  card("USB", "U", "What U is the cable connection used to flash programs and power the micro:bit from a computer?", "Ultrasonic sensor", "Underscore", "micro:bit"),
  card("Loop", "L", "What L is a block of code that repeats instructions, such as forever or repeat?", "Logic gate", "Light sensor", "micro:bit"),
  card("Variable", "V", "What V is a named storage location in code that can hold a changing value, like a score?", "Vibration motor", "Voltage", "micro:bit"),
  card("Condition", "C", "What C is a block, like if, that only runs code when something is true?", "Compass", "Capacitor", "micro:bit"),
  card("Speaker", "S", "What S is the built-in component on newer micro:bits (v2) that can play sounds and music?", "Sensor", "Switch", "micro:bit"),
  card("Microphone", "M", "What M is the built-in component on newer micro:bits (v2) that can detect sound level?", "Motor", "Magnet", "micro:bit"),
  card("Algorithm", "A", "What A is a precise step-by-step set of instructions for solving a problem, before it's turned into code?", "Array", "Antenna", "micro:bit"),
  card("List", "L", "What L is an ordered collection of multiple values stored under one variable name?", "Loop", "LED", "micro:bit"),
  card("Debug", "D", "What D is the process of finding and fixing errors in your code?", "Display", "Driver", "micro:bit"),
  card("Edge connector", "E", "What E is the strip of metal pads along the bottom of the micro:bit used to attach external components?", "Event", "Enclosure", "micro:bit"),
  card("Event", "E", "What E is a trigger block, such as on button A pressed, that runs code in response to something happening?", "Edge connector", "Encoder", "micro:bit"),
  card("Battery", "B", "What B is the external power pack that lets the micro:bit run without being plugged into a computer?", "Button", "Bluetooth", "micro:bit"),
  card("Bluetooth", "B", "What B is the short-range wireless technology the micro:bit can use to communicate with a phone or tablet app?", "Battery", "Button", "micro:bit"),
  card("Pin", "P", "What P is a single connection point on the edge connector that can be used for input or output?", "Program", "Processor", "micro:bit"),
  card("Firmware", "F", "What F is the built-in software on the micro:bit that lets it run and interpret uploaded programs?", "Function", "Flash", "micro:bit"),
];

const cyberSafety = [
  card("Password", "P", "What P is a secret string of characters used to prove your identity when logging in?", "Phishing", "Proxy", "Cyber Safety"),
  card("Phishing", "P", "What P is a scam that tricks you into revealing personal details through fake emails or websites?", "Password", "Pop-up", "Cyber Safety"),
  card("Malware", "M", "What M is a general term for malicious software designed to damage or gain unauthorised access to a device?", "Modem", "Megabyte", "Cyber Safety"),
  card("Firewall", "F", "What F is a security system that monitors and filters network traffic between a trusted network and the internet?", "File", "Format", "Cyber Safety"),
  card("VPN", "V", "What V is a service that encrypts your internet connection and hides your IP address?", "Virus", "Video call", "Cyber Safety"),
  card("HTTPS", "H", "What H is the secure version of the protocol web browsers use to load pages, shown as a padlock in the address bar?", "Hyperlink", "Hard drive", "Cyber Safety"),
  card("URL", "U", "What U is the web address you type or click to reach a specific page?", "Upload", "USB", "Cyber Safety"),
  card("Cookie", "C", "What C is a small file a website stores in your browser to remember your preferences or login?", "Cache", "CAPTCHA", "Cyber Safety"),
  card("Browser", "B", "What B is the software you use to view websites, such as Chrome, Firefox or Edge?", "Bandwidth", "Bluetooth", "Cyber Safety"),
  card("ISP", "I", "What I is the company that provides your connection to the internet?", "IP address", "Icon", "Cyber Safety"),
  card("IP address", "I", "What I is the unique numerical label assigned to a device on a network?", "ISP", "Inbox", "Cyber Safety"),
  card("Router", "R", "What R is the device that directs data between your home network and the internet?", "RAM", "Ransomware", "Cyber Safety"),
  card("Wi-Fi", "W", "What W is the wireless technology that lets devices connect to a network without cables?", "Webcam", "Worm", "Cyber Safety"),
  card("Encryption", "E", "What E is the process of scrambling data so only someone with the right key can read it?", "Email", "Ethernet", "Cyber Safety"),
  card("Two-factor authentication", "T", "What T is a login step that asks for a second proof of identity, like a text code, after your password?", "Trojan", "Tracking cookie", "Cyber Safety"),
  card("Cyberbullying", "C", "What C is the use of digital technology to repeatedly harass, threaten or humiliate someone?", "Cache", "CAPTCHA", "Cyber Safety"),
  card("Digital footprint", "D", "What D is the trail of data you leave behind from your online activity?", "Download", "Domain", "Cyber Safety"),
  card("Privacy settings", "P", "What P are the controls on an account or app that decide who can see your information?", "Phishing", "Pop-up", "Cyber Safety"),
  card("Antivirus", "A", "What A is software designed to detect and remove malicious programs from a device?", "Attachment", "Adware", "Cyber Safety"),
  card("Spam", "S", "What S is unwanted, often repeated junk email usually sent in bulk?", "Server", "Search engine", "Cyber Safety"),
  card("Ransomware", "R", "What R is malware that locks or encrypts your files and demands payment to restore access?", "Router", "RAM", "Cyber Safety"),
  card("Trojan", "T", "What T is malware disguised as legitimate software to trick you into installing it?", "Two-factor authentication", "Tracking cookie", "Cyber Safety"),
  card("Virus", "V", "What V is malicious code that attaches itself to files and spreads when they're shared or opened?", "VPN", "Video call", "Cyber Safety"),
  card("Worm", "W", "What W is malware that spreads by itself across networks without needing a host file?", "Wi-Fi", "Webcam", "Cyber Safety"),
  card("Strong password", "S", "What S is a password that's long, unique and mixes letters, numbers and symbols to resist guessing?", "Spam", "Server", "Cyber Safety"),
];

const computingHistory = [
  card("Abacus", "A", "What A is an ancient calculating tool that uses beads on rods to represent numbers?", "Algorithm", "Analytical Engine", "Computing History"),
  card("Analytical Engine", "A", "What A was Charles Babbage's 19th-century mechanical design for a general-purpose programmable computer?", "Abacus", "ARPANET", "Computing History"),
  card("Ada Lovelace", "A", "What A is regarded as the first computer programmer, for her notes on Babbage's Analytical Engine?", "Analytical Engine", "Abacus", "Computing History"),
  card("Alan Turing", "A", "What A is the mathematician who proposed the Turing Test and helped break the Enigma code at Bletchley Park?", "ARPANET", "Abacus", "Computing History"),
  card("ENIAC", "E", "What E was one of the first general-purpose electronic computers, built in the 1940s and filling an entire room?", "Ethernet", "Encryption", "Computing History"),
  card("Vacuum tube", "V", "What V is the fragile, bulb-like electronic component used to switch and amplify signals in early computers?", "Von Neumann architecture", "Video card", "Computing History"),
  card("Transistor", "T", "What T is the tiny semiconductor switch, invented in 1947, that replaced vacuum tubes and shrank computers dramatically?", "Turing Test", "Toolbar", "Computing History"),
  card("Integrated circuit", "I", "What I is a chip that packs many transistors onto a single piece of silicon?", "Internet", "Icon", "Computing History"),
  card("Microprocessor", "M", "What M is a complete processor built onto a single integrated circuit chip?", "Mainframe", "Mouse", "Computing History"),
  card("Mainframe", "M", "What M is a large, powerful computer used by big organisations for bulk data processing, common from the 1950s-70s?", "Microprocessor", "Mouse", "Computing History"),
  card("Personal computer", "P", "What P is a computer designed for use by one person at a time, at home or in an office?", "Punch card", "Printer", "Computing History"),
  card("Punch card", "P", "What P is a stiff paper card with holes used to store data and instructions for early computers?", "Personal computer", "Printer", "Computing History"),
  card("UNIVAC", "U", "What U was the first commercially produced electronic computer in the United States, delivered in 1951?", "USB", "Update", "Computing History"),
  card("Colossus", "C", "What C was the code-breaking computer built at Bletchley Park during World War II to help crack German ciphers?", "CPU", "Cache", "Computing History"),
  card("Von Neumann architecture", "V", "What V describes a computer design where program instructions and data share the same memory?", "Vacuum tube", "Video card", "Computing History"),
  card("ARPANET", "A", "What A was the early computer network, funded by the US military, that became the basis for the modern internet?", "Abacus", "Ada Lovelace", "Computing History"),
  card("World Wide Web", "W", "What W is the system of linked hypertext pages, invented by Tim Berners-Lee in 1989, that we access via browsers?", "Windows", "Wi-Fi", "Computing History"),
  card("Moore's Law", "M", "What M is the observation that the number of transistors on a chip roughly doubles every two years?", "Mainframe", "Microprocessor", "Computing History"),
  card("Graphical user interface", "G", "What G, often shortened to GUI, lets users interact with a computer using windows, icons and a mouse instead of typed commands?", "Google", "Gigabyte", "Computing History"),
  card("Mouse", "M", "What M is the handheld pointing device, popularised by Xerox and then Apple, used to control an on-screen cursor?", "Mainframe", "Microprocessor", "Computing History"),
  card("Floppy disk", "F", "What F is a portable magnetic storage disk, common from the 1970s to 1990s, that gave the Save icon its shape?", "Firewall", "Format", "Computing History"),
  card("Hard disk drive", "H", "What H is a storage device that uses spinning magnetic platters to store data permanently inside a computer?", "Hyperlink", "HTTP", "Computing History"),
  card("Smartphone", "S", "What S is a mobile phone that combines computing power, internet access and apps in one handheld device?", "Server", "Software", "Computing History"),
  card("Silicon Valley", "S", "What S is the region in California, named for the material used in chips, that became the centre of the global tech industry?", "Spreadsheet", "Server", "Computing History"),
];

const pythonBeginners = [
  card("Variable", "V", "What V is a named location in memory used to store a value that can change while a program runs?", "Void", "Vector", "Python"),
  card("String", "S", "What S is a data type used to store text, written inside quotation marks in Python?", "Syntax", "Statement", "Python"),
  card("Integer", "I", "What I is a whole-number data type in Python, with no decimal point, such as 5 or -12?", "Indentation", "Index", "Python"),
  card("Float", "F", "What F is a data type used to store numbers with a decimal point, such as 3.14?", "Function", "For loop", "Python"),
  card("Boolean", "B", "What B is a data type that can only be True or False?", "Break", "Built-in function", "Python"),
  card("List", "L", "What L is an ordered, changeable collection of items written inside square brackets in Python?", "Loop", "Library", "Python"),
  card("For loop", "F", "What F is a loop that repeats a block of code once for each item in a sequence?", "Float", "Function", "Python"),
  card("While loop", "W", "What W is a loop that keeps repeating a block of code as long as a condition stays true?", "Whitespace", "Wildcard", "Python"),
  card("If statement", "I", "What I is a control structure that runs a block of code only when a condition is true?", "Integer", "Index", "Python"),
  card("Function", "F", "What F is a named, reusable block of code that performs a specific task, defined using def in Python?", "Float", "For loop", "Python"),
  card("Parameter", "P", "What P is a named input variable listed in a function's definition, which receives a value when the function is called?", "Print", "Python", "Python"),
  card("Return", "R", "What R is the keyword used inside a function to send a value back to wherever the function was called?", "Range", "Read", "Python"),
  card("Print", "P", "What P is the built-in function used to display output to the screen?", "Parameter", "Python", "Python"),
  card("Input", "I", "What I is the built-in function used to get typed text from the user while a program runs?", "Integer", "Indentation", "Python"),
  card("Comment", "C", "What C is a line of text starting with a hash symbol that Python ignores when running the program, used to explain code?", "Class", "Concatenation", "Python"),
  card("Indentation", "I", "What I is the consistent whitespace at the start of a line that Python uses to show which lines belong to a block?", "Integer", "Index", "Python"),
  card("Module", "M", "What M is a file of Python code, like math or random, that you can bring into your own program with import?", "Method", "Mutable", "Python"),
  card("Import", "I", "What I is the keyword used to bring a module's code into your own program so you can use it?", "Index", "Integer", "Python"),
  card("Dictionary", "D", "What D is a collection of key-value pairs, written inside curly braces, that lets you look values up by a unique key?", "Debugging", "Data type", "Python"),
  card("Tuple", "T", "What T is an ordered, unchangeable collection of items written inside round brackets in Python?", "Type", "Try-except", "Python"),
  card("Index", "I", "What I is the position number used to access a specific item in a list or string, starting from 0?", "Integer", "Indentation", "Python"),
  card("Concatenation", "C", "What C is the act of joining two strings together, often using the plus operator?", "Comment", "Class", "Python"),
  card("Syntax error", "S", "What S is a mistake that breaks Python's grammar rules, stopping the program from running at all?", "String", "Statement", "Python"),
  card("Debugging", "D", "What D is the process of finding and fixing errors in a program?", "Dictionary", "Data type", "Python"),
  card("f-string", "F", "What F is a Python string prefix that lets you insert variable values directly inside a string, like f\"Hello {name}\"?", "Float", "Function", "Python"),
  card("Class", "C", "What C is a blueprint for creating objects, bundling together data and functions (methods) in Python?", "Comment", "Concatenation", "Python"),
];

const year7Computing = [
  card("Decomposition", "D", "What D is the process of breaking down a complex problem into smaller, manageable parts?", "Debugging", "Data type", "Year 7 Computing"),
  card("Pattern Recognition", "P", "What P is the skill of finding similarities or trends within a problem to solve it more efficiently?", "Peripherals", "Pseudocode", "Year 7 Computing"),
  card("Abstraction", "A", "What A means stripping away unnecessary details to focus only on the important information?", "Algorithm", "Antivirus", "Year 7 Computing"),
  card("Algorithmic Thinking", "A", "What A is the process of creating a step-by-step set of instructions to solve a problem?", "Abstraction", "Antivirus", "Year 7 Computing"),
  card("Algorithm", "A", "What A is a precise sequence of instructions designed to complete a specific task?", "Abstraction", "Antivirus", "Year 7 Computing"),
  card("Sequence", "S", "What S is the specific order in which instructions are executed by a computer?", "Selection", "Storage", "Year 7 Computing"),
  card("Selection", "S", "What S means making decisions in code using conditional statements like IF, THEN and ELSE?", "Sequence", "Storage", "Year 7 Computing"),
  card("Iteration", "I", "What I means repeating a block of code multiple times using FOR or WHILE commands?", "Input", "IP Address", "Year 7 Computing"),
  card("Variable", "V", "What V is a named storage location in a computer's memory used to hold data that can change?", "Virus", "Video card", "Year 7 Computing"),
  card("Input", "I", "What I is data sent to a computer program, such as a keyboard press?", "Iteration", "IP Address", "Year 7 Computing"),
  card("Output", "O", "What O is the action or display a computer program returns after processing input?", "Operating System", "Online", "Year 7 Computing"),
  card("Debugging", "D", "What D is the process of identifying and fixing errors, or bugs, within a program?", "Decomposition", "Data type", "Year 7 Computing"),
  card("Hardware", "H", "What H describes the physical, touchable components of a computer system?", "Hard drive", "Hyperlink", "Year 7 Computing"),
  card("Software", "S", "What S describes the digital programs and applications that tell the hardware what to do?", "Sequence", "Storage", "Year 7 Computing"),
  card("CPU", "C", "What C, standing for Central Processing Unit, is often called the brain of the computer because it processes all instructions?", "Cloud Computing", "Cache", "Year 7 Computing"),
  card("RAM", "R", "What R, standing for Random Access Memory, is temporary, volatile memory used to hold data currently in use?", "ROM", "Router", "Year 7 Computing"),
  card("Storage", "S", "What S is non-volatile, permanent hardware used to save files, such as SSDs, HDDs and USB drives?", "Software", "Sequence", "Year 7 Computing"),
  card("Peripherals", "P", "What P are external hardware components classified as either input devices, like a mouse, or output devices, like a monitor?", "Pattern Recognition", "Pseudocode", "Year 7 Computing"),
  card("Operating System", "O", "What O is the core software, like Windows, macOS or Linux, that manages computer hardware and other apps?", "Output", "Online", "Year 7 Computing"),
  card("Binary", "B", "What B is a base-2 number system consisting entirely of 0s and 1s used by computers to process data?", "Byte", "Bit", "Year 7 Computing"),
  card("Bit", "B", "What B is the smallest unit of digital data, representing a single 0 or 1?", "Byte", "Binary", "Year 7 Computing"),
  card("Byte", "B", "What B is a group of 8 bits that can represent a single character, like a letter or number?", "Bit", "Binary", "Year 7 Computing"),
  card("Denary", "D", "What D, also called decimal, is the standard base-10 number system used by humans (0-9)?", "Debugging", "Decomposition", "Year 7 Computing"),
  card("Network", "N", "What N describes two or more connected computers or devices that share resources and data?", "Netiquette", "Notification", "Year 7 Computing"),
  card("Internet", "I", "What I is a massive, global network connecting millions of smaller networks worldwide?", "Input", "IP Address", "Year 7 Computing"),
  card("World Wide Web", "W", "What W, often shortened to WWW, is the collection of web pages and websites accessed via the internet?", "Wi-Fi", "Webcam", "Year 7 Computing"),
  card("IP Address", "I", "What I is a unique numerical label assigned to every device connected to a computer network?", "Internet", "Input", "Year 7 Computing"),
  card("Router", "R", "What R is a piece of network hardware that forwards data packets between different computer networks?", "RAM", "ROM", "Year 7 Computing"),
  card("Cloud Computing", "C", "What C means storing and accessing data or programs over the internet instead of a local hard drive?", "CPU", "Cache", "Year 7 Computing"),
  card("Phishing", "P", "What P describes fake emails or messages designed to trick users into giving away sensitive information?", "Peripherals", "Pattern Recognition", "Year 7 Computing"),
  card("Malware", "M", "What M is malicious software, including viruses and spyware, created to damage or disrupt computer systems?", "Machine Learning", "Monitor", "Year 7 Computing"),
  card("Two-Factor Authentication", "T", "What T is a security process requiring two distinct forms of identification before granting access?", "Trojan", "Touchscreen", "Year 7 Computing"),
  card("Digital Footprint", "D", "What D is the permanent trail of data and information left behind by a user's online activity?", "Debugging", "Decomposition", "Year 7 Computing"),
  card("Artificial Intelligence", "A", "What A describes computer systems designed to mimic human intelligence by learning and problem-solving?", "Abstraction", "Algorithm", "Year 7 Computing"),
  card("Machine Learning", "M", "What M is a subset of AI where computers learn patterns from data without being explicitly programmed?", "Malware", "Monitor", "Year 7 Computing"),
];

const decks = [
  ["sample-microbit.csv", microbit],
  ["sample-cyber-safety.csv", cyberSafety],
  ["sample-computing-history.csv", computingHistory],
  ["sample-python-beginners.csv", pythonBeginners],
  ["sample-year7-computing.csv", year7Computing],
];

for (const [filename, cards] of decks) {
  const csv = cardsToCsv(cards);
  const result = parseAndValidateCsv(csv);
  if (!result.valid) {
    console.error(`INVALID: ${filename}`);
    console.error(result.errors.join("\n"));
    process.exitCode = 1;
    continue;
  }
  writeFileSync(new URL(`../data/${filename}`, import.meta.url), csv, "utf8");
  console.log(`ok  ${filename}: ${cards.length} rows, valid`);
}
