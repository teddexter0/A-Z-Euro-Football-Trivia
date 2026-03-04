import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Fuse from 'fuse.js';

const LETTER_SCORES = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
  N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
};

// Nickname / shorthand → canonical DB name.
// Each alias is valid in the round whose letter matches the CANONICAL name's first letter.
// e.g. 'gazza' → 'Paul Gascoigne' → valid in P round (Gascoigne starts with G but Paul starts with P)
// e.g. 'dinho' → 'Ronaldinho'     → valid in R round
// e.g. 'cr7'   → 'Cristiano Ronaldo' → valid in C round
const PLAYER_ALIASES = {

  // ── Lionel Messi ────────────────────────────────────────────────────────────
  'leo':              'Lionel Messi',            // L round
  'leo messi':        'Lionel Messi',            // L round
  'la pulga':         'Lionel Messi',            // L round
  'messi':            'Lionel Messi',            // L round (surname alone)
  'el messias':       'Lionel Messi',            // L round

  // ── Cristiano Ronaldo ───────────────────────────────────────────────────────
  'cr7':              'Cristiano Ronaldo',        // C round
  'cristiano':        'Cristiano Ronaldo',        // C round

  // ── Ronaldo Nazário ────────────────────────────────────────────────────────
  'r9':               'Ronaldo Nazário',          // R round
  'ronaldo r9':       'Ronaldo Nazário',          // R round
  'el fenomeno':      'Ronaldo Nazário',          // R round
  'il fenomeno':      'Ronaldo Nazário',          // R round
  'o fenomeno':       'Ronaldo Nazário',          // R round

  // ── Zinédine Zidane ────────────────────────────────────────────────────────
  'zizou':            'Zinédine Zidane',          // Z round

  // ── Ronaldinho ─────────────────────────────────────────────────────────────
  'dinho':            'Ronaldinho',               // R round
  'ronaldinho gaucho':'Ronaldinho',               // R round

  // ── Diego Maradona ─────────────────────────────────────────────────────────
  'd10s':             'Diego Maradona',           // D round
  'el diego':         'Diego Maradona',           // D round
  'el pibe de oro':   'Diego Maradona',           // D round
  'hand of god':      'Diego Maradona',           // D round

  // ── Thierry Henry ──────────────────────────────────────────────────────────
  'king henry':       'Thierry Henry',            // T round
  'titi':             'Thierry Henry',            // T round

  // ── Paulo Dybala ───────────────────────────────────────────────────────────
  'la joya':          'Paulo Dybala',             // P round

  // ── Paul Gascoigne ─────────────────────────────────────────────────────────
  'gazza':            'Paul Gascoigne',           // P round

  // ── David Silva ────────────────────────────────────────────────────────────
  'el mago':          'David Silva',              // D round
  'merlin':           'David Silva',              // D round

  // ── Fernando Torres ────────────────────────────────────────────────────────
  'el nino':          'Fernando Torres',          // F round

  // ── Radamel Falcao ─────────────────────────────────────────────────────────
  'el tigre':         'Radamel Falcao',           // R round

  // ── Edinson Cavani ─────────────────────────────────────────────────────────
  'el matador':       'Edinson Cavani',           // E round
  'cavani':           'Edinson Cavani',           // E round

  // ── Luis Suárez ────────────────────────────────────────────────────────────
  'el pistolero':     'Luis Suárez',              // L round
  'suarez':           'Luis Suárez',              // L round

  // ── Javier Mascherano ──────────────────────────────────────────────────────
  'el jefecito':      'Javier Mascherano',        // J round

  // ── Javier Pastore ─────────────────────────────────────────────────────────
  'el flaco':         'Javier Pastore',           // J round

  // ── Nicolas Anelka ─────────────────────────────────────────────────────────
  'le sulk':          'Nicolas Anelka',           // N round

  // ── Laurent Blanc ──────────────────────────────────────────────────────────
  'le president':     'Laurent Blanc',            // L round

  // ── Franz Beckenbauer ──────────────────────────────────────────────────────
  'der kaiser':       'Franz Beckenbauer',        // F round

  // ── Oliver Kahn ────────────────────────────────────────────────────────────
  'der titan':        'Oliver Kahn',              // O round

  // ── Gerd Müller ────────────────────────────────────────────────────────────
  'der bomber':       'Gerd Müller',              // G round
  'bomber der nation':'Gerd Müller',              // G round

  // ── Thomas Müller ──────────────────────────────────────────────────────────
  'der raumdeuter':   'Thomas Müller',            // T round

  // ── Paolo Maldini ──────────────────────────────────────────────────────────
  'il capitano':      'Paolo Maldini',            // P round
  'maldini':          'Paolo Maldini',            // P round

  // ── Roberto Baggio ─────────────────────────────────────────────────────────
  'il divino codino': 'Roberto Baggio',           // R round
  'the divine ponytail':'Roberto Baggio',         // R round

  // ── Andrea Pirlo ───────────────────────────────────────────────────────────
  'il maestro':       'Andrea Pirlo',             // A round
  'il architetto':    'Andrea Pirlo',             // A round

  // ── Gianluigi Buffon ───────────────────────────────────────────────────────
  'gigi':             'Gianluigi Buffon',         // G round
  'gigi buffon':      'Gianluigi Buffon',         // G round
  'supergigi':        'Gianluigi Buffon',         // G round

  // ── Gianluigi Donnarumma ───────────────────────────────────────────────────
  'gigi donnarumma':  'Gianluigi Donnarumma',     // G round
  'gigio':            'Gianluigi Donnarumma',     // G round

  // ── Thiago Silva ───────────────────────────────────────────────────────────
  'o monstro':        'Thiago Silva',             // T round

  // ── Samuel Eto'o ───────────────────────────────────────────────────────────
  'etoo':             "Samuel Eto'o",             // S round
  'eto':              "Samuel Eto'o",             // S round

  // ── Zlatan Ibrahimović ─────────────────────────────────────────────────────
  'ibra':             'Zlatan Ibrahimović',        // Z round
  'zlatanovic':       'Zlatan Ibrahimović',        // Z round

  // ── Kaká ───────────────────────────────────────────────────────────────────
  'kaka':             'Kaká',                     // K round

  // ── David Beckham ──────────────────────────────────────────────────────────
  'becks':            'David Beckham',            // D round
  'golden balls':     'David Beckham',            // D round

  // ── Robert Lewandowski ─────────────────────────────────────────────────────
  'lewy':             'Robert Lewandowski',       // R round
  'lewi':             'Robert Lewandowski',       // R round

  // ── Andriy Shevchenko ──────────────────────────────────────────────────────
  'sheva':            'Andriy Shevchenko',        // A round

  // ── Son Heung-min ──────────────────────────────────────────────────────────
  'sonny':            'Son Heung-min',            // S round

  // ── Wayne Rooney ───────────────────────────────────────────────────────────
  'wazza':            'Wayne Rooney',             // W round

  // ── Mohamed Salah ──────────────────────────────────────────────────────────
  'mo salah':         'Mohamed Salah',            // M round
  'mo':               'Mohamed Salah',            // M round
  'the egyptian king':'Mohamed Salah',            // M round

  // ── Steven Gerrard ─────────────────────────────────────────────────────────
  'stevie g':         'Steven Gerrard',           // S round

  // ── Filippo Inzaghi ────────────────────────────────────────────────────────
  'pippo':            'Filippo Inzaghi',          // F round
  'pippo inzaghi':    'Filippo Inzaghi',          // F round

  // ── Frank Lampard ──────────────────────────────────────────────────────────
  'lamps':            'Frank Lampard',            // F round
  'super frank':      'Frank Lampard',            // F round

  // ── Romelu Lukaku ──────────────────────────────────────────────────────────
  'big rom':          'Romelu Lukaku',            // R round
  'rom':              'Romelu Lukaku',            // R round

  // ── Mario Balotelli ────────────────────────────────────────────────────────
  'super mario':      'Mario Balotelli',          // M round

  // ── Sergio Agüero ──────────────────────────────────────────────────────────
  'kun':              'Sergio Agüero',            // S round
  'kun aguero':       'Sergio Agüero',            // S round

  // ── Bastian Schweinsteiger ─────────────────────────────────────────────────
  'schweini':         'Bastian Schweinsteiger',   // B round
  'basti':            'Bastian Schweinsteiger',   // B round

  // ── Iker Casillas ──────────────────────────────────────────────────────────
  'san iker':         'Iker Casillas',            // I round

  // ── Dimitar Berbatov ───────────────────────────────────────────────────────
  'berba':            'Dimitar Berbatov',         // D round

  // ── Jay-Jay Okocha ─────────────────────────────────────────────────────────
  'jay jay':          'Jay-Jay Okocha',           // J round

  // ── Juan Román Riquelme ────────────────────────────────────────────────────
  'jrr':              'Juan Román Riquelme',      // J round

  // ── Eusébio ────────────────────────────────────────────────────────────────
  'the black panther':'Eusébio',                  // E round
  'black panther':    'Eusébio',                  // E round

  // ── Erling Haaland ─────────────────────────────────────────────────────────
  'the terminator':   'Erling Haaland',           // E round

  // ── Khvicha Kvaratskhelia ──────────────────────────────────────────────────
  'kvara':            'Khvicha Kvaratskhelia',    // K round
  'kvaratskhelia':    'Khvicha Kvaratskhelia',    // K round

  // ── Vinícius Júnior ────────────────────────────────────────────────────────
  'vini jr':          'Vinícius Júnior',          // V round
  'vini':             'Vinícius Júnior',          // V round

  // ── Virgil van Dijk ────────────────────────────────────────────────────────
  'vvd':              'Virgil van Dijk',          // V round

  // ── Trent Alexander-Arnold ─────────────────────────────────────────────────
  'taa':              'Trent Alexander-Arnold',   // T round

  // ── Kevin De Bruyne ────────────────────────────────────────────────────────
  'kdb':              'Kevin De Bruyne',          // K round

  // ── Robin van Persie ───────────────────────────────────────────────────────
  'rvp':              'Robin van Persie',         // R round

  // ── Eric Cantona ───────────────────────────────────────────────────────────
  'the king':         'Eric Cantona',             // E round
  'king eric':        'Eric Cantona',             // E round

  // ── Karim Benzema ──────────────────────────────────────────────────────────
  'benz':             'Karim Benzema',            // K round
  'kb9':              'Karim Benzema',            // K round

  // ── Kylian Mbappé ──────────────────────────────────────────────────────────
  'km10':             'Kylian Mbappé',            // K round
  'donatello':        'Kylian Mbappé',            // K round

  // ── Antoine Griezmann ──────────────────────────────────────────────────────
  'grizou':           'Antoine Griezmann',        // A round
  'grizz':            'Antoine Griezmann',        // A round

  // ── Jude Bellingham ────────────────────────────────────────────────────────
  'bells':            'Jude Bellingham',          // J round
  'jude':             'Jude Bellingham',          // J round

  // ── Luka Modrić ────────────────────────────────────────────────────────────
  'modric':           'Luka Modrić',              // L round

  // ── Andrés Iniesta ─────────────────────────────────────────────────────────
  'iniesta':          'Andrés Iniesta',           // A round

  // ── Xavi Hernández ─────────────────────────────────────────────────────────
  'xavi':             'Xavi Hernández',           // X round

  // ── Carlos Tevez ───────────────────────────────────────────────────────────
  'carlitos':         'Carlos Tevez',             // C round
  'tevez':            'Carlos Tevez',             // C round

  // ── George Weah ────────────────────────────────────────────────────────────
  'king george':      'George Weah',              // G round

  // ── Abédi Pelé ─────────────────────────────────────────────────────────────
  'abedi':            'Abédi Pelé',               // A round
  'abedi pele':       'Abédi Pelé',               // A round

  // ── Alessandro Del Piero ───────────────────────────────────────────────────
  'pinturicchio':     'Alessandro Del Piero',     // A round
  'del piero':        'Alessandro Del Piero',     // A round

  // ── Gianluca Vialli ────────────────────────────────────────────────────────
  'luca vialli':      'Gianluca Vialli',          // G round
  'vialli':           'Gianluca Vialli',          // G round

  // ── Gianfranco Zola ────────────────────────────────────────────────────────
  'zola':             'Gianfranco Zola',          // G round
  'magic box':        'Gianfranco Zola',          // G round

  // ── Dennis Bergkamp ────────────────────────────────────────────────────────
  'the non flying dutchman': 'Dennis Bergkamp',  // D round
  'iceman':           'Dennis Bergkamp',          // D round

  // ── Patrick Vieira ─────────────────────────────────────────────────────────
  'vieira':           'Patrick Vieira',           // P round

  // ── Didier Drogba ──────────────────────────────────────────────────────────
  'drogba':           'Didier Drogba',            // D round
  'the special one':  'Didier Drogba',            // D round (Chelsea era nickname)

  // ── Eden Hazard ────────────────────────────────────────────────────────────
  'hazard':           'Eden Hazard',              // E round

  // ── Sadio Mané ─────────────────────────────────────────────────────────────
  'mane':             'Sadio Mané',               // S round

  // ── N'Golo Kanté ───────────────────────────────────────────────────────────
  'kante':            "N'Golo Kanté",             // N round
  'ngolo':            "N'Golo Kanté",             // N round

  // ── Neymar ─────────────────────────────────────────────────────────────────
  'ney':              'Neymar',                   // N round
  'neymar jr':        'Neymar',                   // N round

  // ── Gareth Bale ────────────────────────────────────────────────────────────
  'bale':             'Gareth Bale',              // G round

  // ── Yaya Touré ─────────────────────────────────────────────────────────────
  'yaya':             'Yaya Touré',               // Y round
  'toure':            'Yaya Touré',               // Y round

  // ── Arjen Robben ───────────────────────────────────────────────────────────
  'robben':           'Arjen Robben',             // A round
  'the roller':       'Arjen Robben',             // A round

  // ── Mesut Özil ─────────────────────────────────────────────────────────────
  'ozil':             'Mesut Özil',               // M round

  // ── Lamine Yamal ───────────────────────────────────────────────────────────
  'yamal':            'Lamine Yamal',             // L round

  // ── Pedri ──────────────────────────────────────────────────────────────────
  'pedri gonzalez':   'Pedri',                    // P round

  // ── Bukayo Saka ────────────────────────────────────────────────────────────
  'saka':             'Bukayo Saka',              // B round

  // ── Phil Foden ─────────────────────────────────────────────────────────────
  'foden':            'Phil Foden',               // P round
  'the stockport iniesta': 'Phil Foden',          // P round

  // ── Marcus Rashford ────────────────────────────────────────────────────────
  'rashford':         'Marcus Rashford',          // M round

  // ── Cole Palmer ────────────────────────────────────────────────────────────
  'cp10':             'Cole Palmer',              // C round

  // ── Declan Rice ────────────────────────────────────────────────────────────
  'dec':              'Declan Rice',              // D round
  'the rice':         'Declan Rice',              // D round

  // ── Rodri ──────────────────────────────────────────────────────────────────
  'rodrigo hernandez': 'Rodri',                  // R round

  // ── Jack Grealish ──────────────────────────────────────────────────────────
  'grealish':         'Jack Grealish',            // J round

  // ── Raheem Sterling ────────────────────────────────────────────────────────
  'sterling':         'Raheem Sterling',          // R round
  'raz':              'Raheem Sterling',          // R round

  // ── Harry Kane ─────────────────────────────────────────────────────────────
  'kane':             'Harry Kane',               // H round

  // ── Heung-Min Son ─────────────────────────────────────────────────────────
  'son':              'Son Heung-min',            // S round

  // ── Gavi ───────────────────────────────────────────────────────────────────
  'gavi paez':        'Gavi',                     // G round

  // ── Ferran Torres ──────────────────────────────────────────────────────────
  'ferran':           'Ferran Torres',            // F round

  // ── Florian Wirtz ──────────────────────────────────────────────────────────
  'wirtz':            'Florian Wirtz',            // F round

  // ── Jamal Musiala ──────────────────────────────────────────────────────────
  'musiala':          'Jamal Musiala',            // J round
  'bambi':            'Jamal Musiala',            // J round

  // ── Alejandro Garnacho ─────────────────────────────────────────────────────
  'garnacho':         'Alejandro Garnacho',       // A round

  // ── Kobbie Mainoo ──────────────────────────────────────────────────────────
  'mainoo':           'Kobbie Mainoo',            // K round

  // ── Michael Ballack ────────────────────────────────────────────────────────
  'ballack':          'Michael Ballack',          // M round
  'little giant':     'Michael Ballack',          // M round

  // ── Lothar Matthäus ────────────────────────────────────────────────────────
  'matthaus':         'Lothar Matthäus',          // L round

  // ── Karl-Heinz Rummenigge ──────────────────────────────────────────────────
  'rummenigge':       'Karl-Heinz Rummenigge',    // K round

  // ── Sepp Maier ─────────────────────────────────────────────────────────────
  'die katze':        'Sepp Maier',              // S round
  'the cat':          'Sepp Maier',              // S round

  // ── Ruud Gullit ────────────────────────────────────────────────────────────
  'gullit':           'Ruud Gullit',              // R round

  // ── Marco van Basten ───────────────────────────────────────────────────────
  'van basten':       'Marco van Basten',         // M round

  // ── Johan Cruyff ───────────────────────────────────────────────────────────
  'cruyff':           'Johan Cruyff',             // J round
  'cruijff':          'Johan Cruyff',             // J round
  'el salvador':      'Johan Cruyff',             // J round

  // ── Michael Laudrup ────────────────────────────────────────────────────────
  'laudrup':          'Michael Laudrup',          // M round

  // ── Peter Schmeichel ───────────────────────────────────────────────────────
  'schmeichel':       'Peter Schmeichel',         // P round

  // ── Rivaldo ────────────────────────────────────────────────────────────────
  'rivaldo':          'Rivaldo',                  // R round

  // ── Robinho ────────────────────────────────────────────────────────────────
  'robinho':          'Robinho',                  // R round

  // ── Adriano ────────────────────────────────────────────────────────────────
  'the emperor':      'Adriano',                  // A round (Adriano "The Emperor")

  // ── Arturo Vidal ───────────────────────────────────────────────────────────
  'el guerrero':      'Arturo Vidal',             // A round
  'king arturo':      'Arturo Vidal',             // A round

  // ── Claudio Marchisio ──────────────────────────────────────────────────────
  'il principino':    'Claudio Marchisio',        // C round

  // ── Hakan Çalhanoğlu ───────────────────────────────────────────────────────
  'calhanoglu':       'Hakan Çalhanoğlu',         // H round
  'calha':            'Hakan Çalhanoğlu',         // H round

  // ── Paulo Futre ────────────────────────────────────────────────────────────
  'futre':            'Paulo Futre',              // P round

  // ── Andriy Shevchenko (extra) ──────────────────────────────────────────────
  'shevchenko':       'Andriy Shevchenko',        // A round

  // ── Cafu ───────────────────────────────────────────────────────────────────
  'the train':        'Cafu',                     // C round
  'pendolino':        'Cafu',                     // C round

  // ── Roberto Carlos ─────────────────────────────────────────────────────────
  'roberto':          'Roberto Carlos',           // R round

  // ── Clarence Seedorf ───────────────────────────────────────────────────────
  'seedorf':          'Clarence Seedorf',         // C round

  // ── Rivaldo ────────────────────────────────────────────────────────────────
  // single name in db, handled by direct match.

  // ── Falcao (standalone) ────────────────────────────────────────────────────
  'el tigre falcao':  'Radamel Falcao',           // R round

  // ── Xherdan Shaqiri ────────────────────────────────────────────────────────
  'shaqiri':          'Xherdan Shaqiri',          // X round
  'the rocket':       'Xherdan Shaqiri',          // X round

  // ── Dani Alves ─────────────────────────────────────────────────────────────
  'dani':             'Dani Alves',               // D round

  // ── Cesc Fàbregas ──────────────────────────────────────────────────────────
  'fabregas':         'Cesc Fàbregas',            // C round
  'cesc':             'Cesc Fàbregas',            // C round

  // ── Luis Figo ──────────────────────────────────────────────────────────────
  'figo':             'Luís Figo',                // L round

  // ── Ryan Giggs ─────────────────────────────────────────────────────────────
  'giggs':            'Ryan Giggs',               // R round

  // ── Paul Scholes ───────────────────────────────────────────────────────────
  'scholesy':         'Paul Scholes',             // P round

  // ── Roy Keane ──────────────────────────────────────────────────────────────
  'keane':            'Roy Keane',                // R round

  // ── Ole Gunnar Solskjaer ───────────────────────────────────────────────────
  'baby faced assassin': 'Ole Gunnar Solskjaer', // O round
  'ole':              'Ole Gunnar Solskjaer',     // O round

  // ── Peter Beardsley ────────────────────────────────────────────────────────
  'beardsley':        'Peter Beardsley',          // P round

  // ── Alan Shearer ───────────────────────────────────────────────────────────
  'shearer':          'Alan Shearer',             // A round

  // ── Gary Lineker ───────────────────────────────────────────────────────────
  'lineker':          'Gary Lineker',             // G round

  // ── Glenn Hoddle ───────────────────────────────────────────────────────────
  'hoddle':           'Glenn Hoddle',             // G round

  // ── Gheorghe Hagi ──────────────────────────────────────────────────────────
  'maradona of the carpathians': 'Gheorghe Hagi',// G round
  'hagi':             'Gheorghe Hagi',            // G round

  // ── Davor Šuker ────────────────────────────────────────────────────────────
  'suker':            'Davor Šuker',              // D round

  // ── Dragan Stojković ───────────────────────────────────────────────────────
  'piksi':            'Dragan Stojković',         // D round

  // ── Dejan Savićević ────────────────────────────────────────────────────────
  'the genius':       'Dejan Savićević',          // D round

  // ── Zvonimir Boban ─────────────────────────────────────────────────────────
  'boban':            'Zvonimir Boban',           // Z round

  // ── Luca Modrić (extra) ────────────────────────────────────────────────────
  'the magician':     'Luka Modrić',             // L round

  // ── Victor Osimhen ─────────────────────────────────────────────────────────
  'osimhen':          'Victor Osimhen',           // V round

  // ── Rafael Leão ────────────────────────────────────────────────────────────
  'leao':             'Rafael Leão',              // R round

  // ── Nicolò Barella ─────────────────────────────────────────────────────────
  'barella':          'Nicolò Barella',           // N round

  // ── Martin Ødegaard ────────────────────────────────────────────────────────
  'odegaard':         'Martin Ødegaard',          // M round

  // ── Federico Valverde ──────────────────────────────────────────────────────
  'fede valverde':    'Federico Valverde',        // F round

  // ── Frenkie de Jong ────────────────────────────────────────────────────────
  'de jong':          'Frenkie de Jong',          // F round

  // ── Joshua Kimmich ─────────────────────────────────────────────────────────
  'kimmich':          'Joshua Kimmich',           // J round

  // ── Dayot Upamecano ────────────────────────────────────────────────────────
  'upa':              'Dayot Upamecano',          // D round

  // ── Aurélien Tchouaméni ────────────────────────────────────────────────────
  'tchouameni':       'Aurélien Tchouaméni',      // A round

  // ── Khephren Thuram ────────────────────────────────────────────────────────
  'thuram':           'Khephren Thuram',          // K round

  // ── Bernardo Silva ─────────────────────────────────────────────────────────
  'bernardo':         'Bernardo Silva',           // B round

  // ── Bruno Fernandes ────────────────────────────────────────────────────────
  'bruno':            'Bruno Fernandes',          // B round

  // ── Rúben Dias ─────────────────────────────────────────────────────────────
  'ruben dias':       'Rúben Dias',               // R round

  // ── João Cancelo ───────────────────────────────────────────────────────────
  'cancelo':          'João Cancelo',             // J round

  // ── João Félix ─────────────────────────────────────────────────────────────
  'felix':            'João Félix',               // J round

  // ── Dani Olmo ──────────────────────────────────────────────────────────────
  'olmo':             'Dani Olmo',                // D round

  // ── Nico Williams ──────────────────────────────────────────────────────────
  'nico':             'Nico Williams',            // N round

  // ── Vítor Baía ─────────────────────────────────────────────────────────────
  'baia':             'Vítor Baía',               // V round

  // ── George Best ────────────────────────────────────────────────────────────
  'el beatle':        'George Best',              // G round
  'fifth beatle':     'George Best',              // G round

  // ── Denis Law ──────────────────────────────────────────────────────────────
  'the king':         'Eric Cantona',             // kept for Cantona, Denis Law → 'the lawman'
  'the lawman':       'Denis Law',                // D round

  // ── Gary Neville ───────────────────────────────────────────────────────────
  'neville':          'Gary Neville',             // G round

  // ── Javier Zanetti ─────────────────────────────────────────────────────────
  'zanetti':          'Javier Zanetti',           // J round

  // ── Samuel Eto'o (Cameroonian Tiger) ────────────────────────────────────────
  'cameroonian tiger':"Samuel Eto'o",             // S round

  // ── Edin Džeko ─────────────────────────────────────────────────────────────
  'dzeko':            'Edin Džeko',               // E round
  'the bosnian diamond': 'Edin Džeko',            // E round

  // ── Mauro Icardi ───────────────────────────────────────────────────────────
  'icardi':           'Mauro Icardi',             // M round

  // ── Ciro Immobile ──────────────────────────────────────────────────────────
  'immobile':         'Ciro Immobile',            // C round

  // ── Lorenzo Pellegrini ─────────────────────────────────────────────────────
  'pellegrini':       'Lorenzo Pellegrini',       // L round

  // ── Victor Gyökeres ────────────────────────────────────────────────────────
  'gyokeres':         'Viktor Gyökeres',          // V round

  // ── Santiago Giménez ───────────────────────────────────────────────────────
  'santi':            'Santi Cazorla',            // S round (Cazorla)
  'chaquito':         'Santiago Giménez',         // S round

  // ── Loïs Openda ────────────────────────────────────────────────────────────
  'openda':           'Loïs Openda',              // L round

  // ── Jonathan David ─────────────────────────────────────────────────────────
  'jojo david':       'Jonathan David',           // J round

  // ── Rayan Cherki ───────────────────────────────────────────────────────────
  'cherki':           'Rayan Cherki',             // R round

  // ── Alexandre Lacazette ────────────────────────────────────────────────────
  'lacazette':        'Alexandre Lacazette',      // A round
  'the general':      'Alexandre Lacazette',      // A round

  // ── Raphaël Guerreiro ──────────────────────────────────────────────────────
  'guerreiro':        'Raphaël Guerreiro',        // R round

  // ── Alphonso Davies ────────────────────────────────────────────────────────
  'phonzie':          'Alphonso Davies',          // A round

  // ── Dani Carvajal ──────────────────────────────────────────────────────────
  'carvajal':         'Dani Carvajal',            // D round
};

const GameBoard = ({ roomId, playerName, gameMode = 'modern' }) => {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [gameState, setGameState] = useState({
    currentLetter: 'A',
    currentLetterIndex: 0,
    players: {},
    scores: {},
    usedPlayers: [],
    roundAnswers: {},
    timer: 30,
    isActive: false,
    gameStarted: false,
    gameMode: gameMode,
    winner: null
  });
  
  const [playerInput, setPlayerInput] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const fuseRef = useRef(null);
  const socketRef = useRef(null);
  const playerDatabaseRef = useRef([]);

  // Strips diacritics and non-alpha characters — used for DB/Fuse comparison
  const normalizePlayerName = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Keeps numbers alongside letters — used only for alias key lookup
  // so "CR7" → "cr7" instead of "cr", matching the PLAYER_ALIASES key
  const normalizeForAlias = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Initialize socket connection
  useEffect(() => {
    const initSocket = async () => {
      try {
        console.log('🔌 Connecting to Socket.io...');
        setConnectionStatus('connecting');
        setMessage('🔌 Connecting to server...');

        const newSocket = io({
          path: '/api/socketio',
          transports: ['websocket', 'polling'],
          timeout: 20000,
          forceNew: true,
          withCredentials: false
        });
        
        socketRef.current = newSocket;

        newSocket.on('connect', () => {
          console.log('✅ Connected:', newSocket.id);
          setConnectionStatus('connected');
          setSocket(newSocket);
          setMessage('✅ Connected! Joining room...');
          
          newSocket.emit('join-room', { roomId, playerName });
        });

        newSocket.on('connection-confirmed', () => {
          console.log('✅ Connection confirmed');
          setMessage('🎯 Ready to play!');
          setTimeout(() => setMessage(''), 3000);
        });

        newSocket.on('join-confirmed', (data) => {
          console.log('✅ Joined room:', data);
          setMessage(`🏠 Joined room! Players: ${data.playersCount}`);
          setTimeout(() => setMessage(''), 3000);
        });

        newSocket.on('connect_error', (error) => {
          console.error('❌ Connection error:', error);
          setConnectionStatus('error');
          setMessage('❌ Connection failed. Try refreshing.');
        });

        newSocket.on('disconnect', (reason) => {
          console.log('🔌 Disconnected:', reason);
          setConnectionStatus('disconnected');
          setMessage('🔌 Disconnected. Reconnecting...');
        });
        
        newSocket.on('game-state-update', (state) => {
          console.log('🎮 Game state:', state);
          setGameState(prevState => ({ ...prevState, ...state }));
        });

        newSocket.on('game-started', () => {
          console.log('🎮 Game started!');
          setMessage('🎮 Game started! GO!');
          setSubmitted(false);
          setPlayerInput('');
          setTimeout(() => setMessage(''), 2000);
        });

        newSocket.on('timer-update', (data) => {
          setGameState(prev => ({ ...prev, timer: data.timer }));
        });

        newSocket.on('new-round', (data) => {
          console.log('🔄 New round:', data.letter);
          setGameState(prev => ({
            ...prev,
            currentLetter: data.letter,
            currentLetterIndex: data.letterIndex,
            roundAnswers: {},
            timer: 30,
            isActive: true
          }));
          setSubmitted(false);
          setPlayerInput('');
          setMessage(`🎯 Letter ${data.letter}!`);
          setTimeout(() => setMessage(''), 2000);
        });

        newSocket.on('round-complete', (results) => {
          console.log('🏁 Round complete');
          setGameState(prev => ({
            ...prev,
            scores: results.scores,
            usedPlayers: results.usedPlayers || [],
            roundAnswers: results.answers,
            isActive: false
          }));
          
          const playerResults = results.answers[playerName];
          if (playerResults?.isValid) {
            setMessage(`✅ "${playerResults.answer}" correct! +${playerResults.points} pts`);
          } else if (playerResults?.answer) {
            setMessage(`❌ "${playerResults.answer}" - invalid`);
          } else {
            setMessage('⏰ Time up!');
          }
        });

        newSocket.on('game-complete', (data) => {
          console.log('🏆 Game complete:', data.winner);
          setGameState(prev => ({ ...prev, winner: data.winner, isActive: false }));
        });

        newSocket.on('error-message', (data) => {
          setMessage(`❌ ${data.message}`);
          setTimeout(() => setMessage(''), 5000);
        });

        newSocket.on('player-left', (data) => {
          setMessage(`👋 ${data.playerName} left`);
          setTimeout(() => setMessage(''), 3000);
        });

      } catch (error) {
        console.error('❌ Socket init failed:', error);
        setConnectionStatus('error');
        setMessage('❌ Failed to connect');
      }
    };
    
    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [roomId, playerName]);

  // Load player database with enhanced debugging
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        setIsLoading(true);
        console.log(`📊 Loading ${gameMode} players...`);
        
        const mode = gameMode === 'icons' ? 'icons' : 'modern';
        const apiUrl = `/api/players/${mode}`;
        
        console.log('🔗 Fetching from:', apiUrl);
        const response = await fetch(apiUrl);
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`API failed: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✅ Loaded ${data.length} players for ${mode} mode`);
        console.log('🎯 Sample players:', data.slice(0, 5));
        
        // Store originals for display; build normalized version for Fuse
        // so accents are stripped before comparison:
        // "Fabregas" -> "fabregas" matches "Cesc Fàbregas" -> "cesc fabregas"
        // "Modric"   -> "modric"   matches "Luka Modrić"   -> "luka modric"
        playerDatabaseRef.current = data;
        const normalizedForFuse = data.map(name => normalizePlayerName(name));

        fuseRef.current = new Fuse(normalizedForFuse, {
          threshold: 0.6,
          distance: 200,
          includeScore: true,
          minMatchCharLength: 3,
          ignoreLocation: true,
          ignoreFieldNorm: true
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Failed to load players:', error);
        setMessage('❌ Failed to load players');
        setIsLoading(false);
      }
    };

    loadPlayers();
  }, [gameMode]);

  const handleStartGame = () => {
    if (!socket || connectionStatus !== 'connected') {
      setMessage('❌ Not connected!');
      return;
    }
    
    console.log('🚀 Starting game...');
    socket.emit('start-game', { roomId });
    setMessage('🎮 Starting...');
  };

  const handleSubmitAnswer = () => {
    if (submitted || !socket || !gameState.isActive) return;
    
    const answer = playerInput.trim();
    if (!answer) return;
    
    setSubmitted(true);
    const validation = validatePlayer(answer, gameState.currentLetter);
    
    console.log('📝 Validation result:', validation);
    console.log('🎯 Player database size:', playerDatabaseRef.current.length);
    
    socket.emit('submit-answer', {
      roomId,
      playerName,
      answer,
      isValid: validation.valid,
      matchedPlayer: validation.matchedPlayer,
      points: validation.valid ? LETTER_SCORES[gameState.currentLetter] : 0
    });
    
    setMessage(validation.valid ? `✅ "${answer}"` : `❌ "${answer}" - ${validation.reason}`);
  };

  // Validation function
  const validatePlayer = (input, letter) => {
    const trimmedInput = input.trim();

    if (!trimmedInput) return { valid: false, reason: 'empty' };
    if (trimmedInput.length < 2) return { valid: false, reason: 'too short' };

    // ── 1. Alias check FIRST (before letter check) ──────────────────────────
    // Use normalizeForAlias so "CR7" → "cr7" matches the alias key (not "cr")
    const aliasKey = normalizeForAlias(trimmedInput);
    const aliasTarget = PLAYER_ALIASES[aliasKey];
    if (aliasTarget) {
      // Validate using the canonical name's first letter, not the raw input.
      // "Dinho" → "Ronaldinho" → must be R round, not D round.
      if (aliasTarget[0].toUpperCase() === letter.toUpperCase()) {
        const normalizedAlias = normalizePlayerName(aliasTarget);
        const aliasInDb = playerDatabaseRef.current.find(
          p => normalizePlayerName(p) === normalizedAlias
        );
        if (aliasInDb) {
          const aliasUsed = gameState.usedPlayers?.some(
            u => normalizePlayerName(u) === normalizedAlias
          );
          if (!aliasUsed) {
            console.log(`✅ Alias: "${trimmedInput}" → "${aliasTarget}"`);
            return { valid: true, matchedPlayer: aliasTarget };
          }
          return { valid: false, reason: 'already used' };
        }
      }
      // Alias found but letter doesn't match → fall through to regular matching
    }

    // ── 2. Letter check ──────────────────────────────────────────────────────
    if (!trimmedInput.toLowerCase().startsWith(letter.toLowerCase())) {
      return { valid: false, reason: 'wrong letter' };
    }

    const normalizedInput = normalizePlayerName(trimmedInput);

    // ── 3. Already-used check ────────────────────────────────────────────────
    const isAlreadyUsed = gameState.usedPlayers?.some(usedPlayer => {
      const normalizedUsed = normalizePlayerName(usedPlayer);
      if (normalizedUsed === normalizedInput) return true;
      if (normalizedUsed.length > 3 && normalizedInput.length > 3) {
        const words1 = normalizedUsed.split(' ');
        const words2 = normalizedInput.split(' ');
        return words1.some(word1 =>
          words2.some(word2 =>
            word1.length > 2 && word2.length > 2 &&
            (word1.includes(word2) || word2.includes(word1))
          )
        );
      }
      return false;
    });
    if (isAlreadyUsed) return { valid: false, reason: 'already used' };

    // ── 4. Fuzzy search ──────────────────────────────────────────────────────
    if (fuseRef.current && playerDatabaseRef.current.length > 0) {
      const results = fuseRef.current.search(normalizedInput);
      console.log('🔍 Fuzzy search results:', results.slice(0, 3));

      if (results.length > 0) {
        for (let i = 0; i < Math.min(results.length, 5); i++) {
          const result = results[i];
          const matchedPlayer = playerDatabaseRef.current[result.refIndex];
          const normalizedMatched = result.item; // already normalized

          if (result.score < 0.6) {
            // Word-boundary guard: at least one word in the matched name must
            // START WITH the input. Prevents "dinho" (D round) from matching
            // "Ronaldinho" whose only word "ronaldinho" starts with "r".
            const hasWordMatch = normalizedMatched
              .split(' ')
              .some(word => word.startsWith(normalizedInput));
            if (!hasWordMatch) continue;

            const conflictsWithUsed = gameState.usedPlayers?.some(usedPlayer => {
              const normalizedUsed = normalizePlayerName(usedPlayer);
              if (normalizedUsed === normalizedMatched) return true;
              const usedWords = normalizedUsed.split(' ');
              const matchedWords = normalizedMatched.split(' ');
              return usedWords.some(w1 =>
                matchedWords.some(w2 =>
                  w1.length > 2 && w2.length > 2 && (w1.includes(w2) || w2.includes(w1))
                )
              );
            });

            if (!conflictsWithUsed) {
              console.log(`✅ Fuzzy match: "${trimmedInput}" -> "${matchedPlayer}" (score: ${result.score})`);
              return { valid: true, matchedPlayer };
            }
          }
        }
      }

      // ── 5. Direct match fallback (word-prefix, requires ≥ 4 chars) ────────
      const directIdx = playerDatabaseRef.current.findIndex(player => {
        const normalizedPlayer = normalizePlayerName(player);
        return normalizedPlayer === normalizedInput ||
          (normalizedInput.length >= 4 &&
            normalizedPlayer.split(' ').some(word => word.startsWith(normalizedInput)));
      });

      if (directIdx !== -1) {
        const directMatch = playerDatabaseRef.current[directIdx];
        console.log(`✅ Direct match: "${trimmedInput}" -> "${directMatch}"`);
        return { valid: true, matchedPlayer: directMatch };
      }
    }

    console.log(`❌ No match found for: "${trimmedInput}"`);
    return { valid: false, reason: 'not found' };
  };

  // Loading screen
  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <div>
          <div style={{
            width: '50px', height: '50px', 
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h2>🎮 Loading Game...</h2>
          <p>Loading {gameMode} players...</p>
        </div>
      </div>
    );
  }

  // Error screen
  if (connectionStatus === 'error') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <div>
          <h2>🚫 Connection Error</h2>
          <p>Cannot connect to game server</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#10b981', color: 'white', border: 'none',
              padding: '15px 30px', borderRadius: '10px', 
              fontSize: '1.1rem', cursor: 'pointer', marginTop: '20px'
            }}
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  // Game complete
  if (gameState.winner) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <h1 style={{ fontSize: '3rem', margin: '0 0 20px 0' }}>🎉 Game Complete!</h1>
          <h2 style={{ color: '#667eea', margin: '0 0 30px 0' }}>🏆 Winner: {gameState.winner}</h2>
          
          <div style={{ margin: '30px 0' }}>
            {Object.entries(gameState.scores)
              .sort(([,a], [,b]) => b - a)
              .map(([player, score], index) => (
                <div key={player} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px',
                  margin: '5px 0',
                  borderRadius: '8px',
                  background: player === gameState.winner ? '#d1fae5' : '#f8fafc'
                }}>
                  <span>#{index + 1} {player}</span>
                  <span>{score} pts</span>
                </div>
              ))}
          </div>
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              onClick={() => window.location.reload()}
              style={{
                background: '#10b981', color: 'white', border: 'none',
                padding: '15px 25px', borderRadius: '10px', cursor: 'pointer'
              }}
            >
              🎮 Play Again
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              style={{
                background: '#667eea', color: 'white', border: 'none',
                padding: '15px 25px', borderRadius: '10px', cursor: 'pointer'
              }}
            >
              🏠 Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const gameInProgress = gameState.gameStarted && !gameState.winner;
  const showStartButton = Object.keys(gameState.players).length >= 1 && !gameState.isActive && !gameInProgress;
  const showWaitingBetweenRounds = gameInProgress && !gameState.isActive;
  const playerCount = Object.keys(gameState.players).length;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', color: 'white', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '3rem', margin: '0 0 15px 0' }}>⚽ A-Z Football Game</h1>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <span>Mode: {gameMode === 'icons' ? '🏆 Icons' : '⚡ Modern'}</span>
            <span>Room: {roomId}</span>
            <span>Status: {connectionStatus === 'connected' ? '🟢 Connected' : '🟡 Connecting'}</span>
          </div>
        </div>

        {/* Letter Section */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '4rem', color: '#667eea', margin: '0 0 20px 0' }}>
            Letter: {gameState.currentLetter}
          </h2>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map((letter, index) => (
              <span key={letter} style={{
                width: '30px', height: '30px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '5px', fontSize: '12px', fontWeight: 'bold',
                background: index < gameState.currentLetterIndex ? '#10b981' :
                           index === gameState.currentLetterIndex ? '#667eea' : '#f1f5f9',
                color: index <= gameState.currentLetterIndex ? 'white' : '#94a3b8'
              }}>
                {letter}
              </span>
            ))}
          </div>
          
          {gameState.isActive && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: '#ef4444', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 'bold'
              }}>
                {gameState.timer}s
              </div>
              <div style={{ flex: 1, maxWidth: '300px', height: '10px', background: '#f1f5f9', borderRadius: '5px' }}>
                <div style={{
                  height: '100%',
                  background: '#10b981',
                  width: `${(gameState.timer / 30) * 100}%`,
                  borderRadius: '5px',
                  transition: 'width 1s linear'
                }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Input Section */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          {showStartButton && (
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h3>🎮 Ready to Play!</h3>
              <p>{playerCount} player{playerCount !== 1 ? 's' : ''} in room</p>
              <button
                onClick={handleStartGame}
                disabled={connectionStatus !== 'connected'}
                style={{
                  padding: '15px 30px',
                  background: connectionStatus === 'connected' ? '#10b981' : '#94a3b8',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontSize: '1.2rem', cursor: 'pointer', width: '100%', maxWidth: '300px'
                }}
              >
                🚀 Start Game ({playerCount} players)
              </button>
            </div>
          )}

          {showWaitingBetweenRounds && (
            <div style={{ textAlign: 'center', marginBottom: '20px', color: '#64748b' }}>
              <h3>⏳ Next round starting soon...</h3>
              <p>Letter {gameState.currentLetter} — Round {gameState.currentLetterIndex + 1}/26</p>
            </div>
          )}
          
          {gameState.isActive && (
            <div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <input
                  type="text"
                  value={playerInput}
                  onChange={(e) => setPlayerInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                  placeholder={`Enter player starting with ${gameState.currentLetter}...`}
                  disabled={submitted}
                  style={{
                    flex: 1, padding: '15px', border: '2px solid #e2e8f0',
                    borderRadius: '10px', fontSize: '1.1rem',
                    background: submitted ? '#f0fdf4' : 'white'
                  }}
                />
                <button 
                  onClick={handleSubmitAnswer}
                  disabled={submitted || !playerInput.trim()}
                  style={{
                    padding: '15px 25px',
                    background: submitted ? '#10b981' : (!playerInput.trim() ? '#94a3b8' : '#667eea'),
                    color: 'white', border: 'none', borderRadius: '10px',
                    cursor: 'pointer', minWidth: '100px'
                  }}
                >
                  {submitted ? '✅ Sent' : 'Submit'}
                </button>
              </div>
              <div style={{ textAlign: 'center', color: '#64748b' }}>
                🎯 Letter {gameState.currentLetter} = {LETTER_SCORES[gameState.currentLetter]} points
              </div>
            </div>
          )}
          
          {message && (
            <div style={{
              padding: '15px', borderRadius: '10px', marginTop: '15px',
              background: message.includes('✅') ? '#d1fae5' : 
                         message.includes('❌') ? '#fecaca' : '#dbeafe',
              color: message.includes('✅') ? '#065f46' : 
                     message.includes('❌') ? '#7f1d1d' : '#1e40af',
              fontWeight: 'bold'
            }}>
              {message}
            </div>
          )}
        </div>

        {/* Players Section */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3>👥 Players ({playerCount})</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '15px'
          }}>
            {Object.entries(gameState.players).map(([name]) => (
              <div key={name} style={{
                padding: '15px',
                borderRadius: '10px',
                background: name === playerName ? '#dbeafe' : '#f8fafc',
                border: `2px solid ${name === playerName ? '#667eea' : '#e2e8f0'}`
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  {name} {name === playerName && '(YOU)'}
                </div>
                <div style={{ color: '#667eea', fontWeight: 'bold', marginBottom: '5px' }}>
                  {gameState.scores[name] || 0} points
                </div>
                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                  {gameState.roundAnswers[name] ? 
                    `✅ ${gameState.roundAnswers[name].answer}` : 
                    (gameState.isActive ? '⏳ Thinking...' : '⏸️ Ready')
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Round Results */}
        {Object.keys(gameState.roundAnswers).length > 0 && !gameState.isActive && (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h3>🏁 Round Results - Letter {gameState.currentLetter}</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '10px'
            }}>
              {Object.entries(gameState.roundAnswers).map(([player, result]) => (
                <div key={player} style={{
                  padding: '15px',
                  borderRadius: '10px',
                  textAlign: 'center',
                  background: result.isValid ? '#d1fae5' : '#fecaca',
                  border: `2px solid ${result.isValid ? '#10b981' : '#ef4444'}`
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{player}</div>
                  <div style={{ marginBottom: '5px' }}>{result.answer || 'No answer'}</div>
                  <div style={{ fontWeight: 'bold', color: result.isValid ? '#059669' : '#dc2626' }}>
                    {result.isValid ? `+${result.points} pts` : '0 pts'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Game Stats */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h4>📊 Game Stats</h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '15px',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '2rem' }}>👥</div>
              <div style={{ fontWeight: 'bold' }}>{playerCount}</div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Players</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem' }}>🎯</div>
              <div style={{ fontWeight: 'bold' }}>{gameState.currentLetterIndex + 1}/26</div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Letters</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem' }}>⚽</div>
              <div style={{ fontWeight: 'bold' }}>{gameState.usedPlayers?.length || 0}</div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Used</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem' }}>📈</div>
              <div style={{ fontWeight: 'bold' }}>{Math.round(((gameState.currentLetterIndex + 1) / 26) * 100)}%</div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Complete</div>
            </div>
          </div>
        </div>

        {/* Used Players */}
        {gameState.usedPlayers && gameState.usedPlayers.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h4>⚽ Used Players ({gameState.usedPlayers.length})</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {gameState.usedPlayers.slice(-10).map((player, index) => (
                <span key={index} style={{
                  background: '#f1f5f9',
                  padding: '5px 10px',
                  borderRadius: '15px',
                  fontSize: '0.9rem',
                  color: '#64748b'
                }}>
                  {player}
                </span>
              ))}
              {gameState.usedPlayers.length > 10 && (
                <span style={{
                  background: '#667eea',
                  color: 'white',
                  padding: '5px 10px',
                  borderRadius: '15px',
                  fontSize: '0.9rem'
                }}>
                  +{gameState.usedPlayers.length - 10} more...
                </span>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setMessage('📋 Link copied!');
                setTimeout(() => setMessage(''), 3000);
              }}
              style={{
                padding: '12px 20px',
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer'
              }}
            >
              🔗 Share
            </button>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 20px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer'
              }}
            >
              🔄 Refresh
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              style={{
                padding: '12px 20px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer'
              }}
            >
              🏠 Home
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GameBoard;