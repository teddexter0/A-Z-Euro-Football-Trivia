import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Fuse from 'fuse.js';
import { wordFuzzyMatch } from '../lib/fuzzyMatch';

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

// ─── Did You Know? Football Facts ───────────────────────────────────────────
const FOOTBALL_FACTS = [
  { player: 'Lionel Messi', fact: 'Messi has won the Ballon d\'Or a record 8 times — more than any other player in history.' },
  { player: 'Cristiano Ronaldo', fact: 'Ronaldo is the all-time leading international goal scorer with over 130 goals for Portugal.' },
  { player: 'Ronaldinho', fact: 'Ronaldinho was once voted the best player in the world two years in a row (2004 & 2005) and was known for never once receiving a red card in his club career.' },
  { player: 'Zinédine Zidane', fact: 'Zidane scored one of the greatest goals in Champions League history — a left-footed volley for Real Madrid vs Bayer Leverkusen in 2002.' },
  { player: 'Ronaldo Nazário', fact: '"El Fenomeno" scored both goals in Brazil\'s 2002 World Cup final win, silencing critics who doubted his recovery from a serious knee injury.' },
  { player: 'Thierry Henry', fact: 'Henry went an entire Premier League season (2001–02) without receiving a single yellow card.' },
  { player: 'Gerd Müller', fact: 'Gerd Müller once scored 85 goals in a single calendar year — a record that stood for decades until Messi broke it in 2012.' },
  { player: 'Paolo Maldini', fact: 'Maldini played his entire 25-year senior career at AC Milan and never received a straight red card in the Champions League.' },
  { player: 'Peter Schmeichel', fact: 'Schmeichel scored 11 career goals as a goalkeeper — including headers and long throws during set pieces.' },
  { player: 'Diego Maradona', fact: 'Maradona scored two goals in the same match against England in 1986 that became the most debated in football history — the "Hand of God" and the "Goal of the Century".' },
  { player: 'Robert Lewandowski', fact: 'Lewandowski scored 5 goals in 9 minutes as a substitute for Bayern Munich against Wolfsburg in 2015 — an all-time Bundesliga record.' },
  { player: 'Erling Haaland', fact: 'Haaland scored 36 Premier League goals in his debut season for Man City — a single-season PL record.' },
  { player: 'Kylian Mbappé', fact: 'Mbappé became only the second teenager ever to score in a World Cup Final when France beat Croatia in 2018.' },
  { player: 'Pelé', fact: 'Pelé reportedly scored over 1,000 career goals — though the official FIFA count and independent researchers debate the exact total.' },
  { player: 'Lev Yashin', fact: 'Lev Yashin is the only goalkeeper to have ever won the Ballon d\'Or (1963). He was known as the "Black Spider".' },
  { player: 'Zlatan Ibrahimović', fact: 'Ibrahimović scored one of the greatest overhead kicks in history — from 30 yards against England in 2012, aged 31.' },
  { player: 'Kaká', fact: 'Kaká won the Ballon d\'Or in 2007 without playing a single UEFA Champions League game past the Round of 16 that season — he won it at club level overall.' },
  { player: 'Andrés Iniesta', fact: 'Iniesta scored the winning goal in the 2010 World Cup Final in extra time — making him one of the most celebrated players in Spanish football history.' },
  { player: 'Xavi Hernández', fact: 'Xavi completed 91% of his passes in the 2010 World Cup — still one of the highest-ever recorded pass accuracy rates at a major tournament.' },
  { player: 'Oliver Kahn', fact: 'Kahn is the only goalkeeper to have won the Golden Ball award at a FIFA World Cup (2002).' },
  { player: 'Samuel Eto\'o', fact: 'Eto\'o won the African Player of the Year award 4 times — more than any other player before the rise of Salah and Mané.' },
  { player: 'Didier Drogba', fact: 'Drogba scored in 4 separate FA Cup Finals for Chelsea — a record. He also netted the equaliser in the 2012 Champions League Final minutes before full time.' },
  { player: 'Wayne Rooney', fact: 'Rooney is England\'s all-time top goal scorer with 53 goals, and scored his first senior international goal as a 17-year-old.' },
  { player: 'Steven Gerrard', fact: 'Gerrard is one of only 5 players to have scored in an FA Cup Final, League Cup Final, UEFA Cup Final, and Champions League Final.' },
  { player: 'Patrick Vieira', fact: 'Vieira was part of Arsenal\'s "Invincibles" squad in 2003–04 that went the entire Premier League season unbeaten (38 games).' },
  { player: 'Dennis Bergkamp', fact: 'Bergkamp was famously terrified of flying and drove or took the Eurostar to away matches in Europe during his career.' },
  { player: 'Eric Cantona', fact: 'Cantona memorably said: "When the seagulls follow the trawler, it\'s because they think sardines will be thrown into the sea." Still baffles journalists today.' },
  { player: 'George Best', fact: 'George Best was the first true football superstar — a cultural icon in the 60s who was once described as the 5th Beatle.' },
  { player: 'Johan Cruyff', fact: 'Cruyff invented the "Cruyff Turn" in the 1974 World Cup against Sweden and revolutionised modern football with his tactical philosophy.' },
  { player: 'Franz Beckenbauer', fact: 'Beckenbauer is one of only two people to have won the World Cup both as a player (1974) and as a manager (1990).' },
  { player: 'Ronaldo Nazário', fact: 'Ronaldo is considered the most complete striker of his generation — praised by both Messi and Ronaldo as their biggest inspiration.' },
  { player: 'Neymar', fact: 'Neymar holds the record for the most expensive transfer ever — PSG paid Barcelona €222 million for him in 2017.' },
  { player: 'Mohamed Salah', fact: 'Salah scored 32 Premier League goals in the 2017–18 season — equalling the all-time record for a 38-game season.' },
  { player: 'Kevin De Bruyne', fact: 'De Bruyne had his season ended by injury in 2017 but still managed 18 assists in a single PL season — a joint record at the time.' },
  { player: 'Luka Modrić', fact: 'Modrić ended the 12-year Messi–Ronaldo domination of the Ballon d\'Or in 2018, winning after Croatia\'s World Cup Final run.' },
  { player: 'Virgil van Dijk', fact: 'Van Dijk was only the second defender ever to be shortlisted for the Ballon d\'Or in the modern era (2019), finishing 2nd behind Messi.' },
  { player: 'David Beckham', fact: 'Beckham scored from the halfway line vs Wimbledon on the opening day of the 1996–97 season aged just 21 — and became a global icon.' },
  { player: 'Sergio Agüero', fact: 'Agüero scored the most dramatic goal in Premier League history — in the 94th minute of the final day of the 2011–12 season to win Man City the title.' },
  { player: 'Frank Lampard', fact: 'Lampard holds the record for goals scored by a midfielder in the Premier League, with 177 goals for Chelsea.' },
  { player: 'Iker Casillas', fact: 'Casillas played 725 games for Real Madrid and kept more clean sheets in La Liga than any other goalkeeper.' },
  { player: 'Gianluigi Buffon', fact: 'Buffon went a record 974 consecutive minutes without conceding in Serie A during the 2015–16 season — nearly 11 full matches.' },
  { player: 'Karim Benzema', fact: 'Benzema won the Ballon d\'Or in 2022, aged 34 — proving he was elite even in his mid-30s. He scored a hat-trick to eliminate PSG in that Champions League campaign.' },
  { player: 'Thibaut Courtois', fact: 'Courtois won the Golden Glove at the 2022 World Cup AND the 2022 Champions League in the same year, cementing himself as arguably the world\'s best goalkeeper.' },
  { player: 'Eden Hazard', fact: 'Hazard was rated as the best player in the Premier League by multiple rivals — Messi once named him the hardest player to face.' },
  { player: 'Harry Kane', fact: 'Kane went his entire Premier League career up to 2023 without winning a major trophy in England — then moved to Bayern Munich to chase silverware.' },
  { player: 'Jude Bellingham', fact: 'Bellingham became the first player in Champions League history to score in each of his first 5 appearances in the competition.' },
  { player: 'Vinícius Júnior', fact: 'Vinicius became the first Brazilian to win the Ballon d\'Or in 2024 — and was only 24 years old at the time.' },
  { player: 'Rúben Dias', fact: 'Dias won the PFA Players\' Player of the Year award in his very first season at Man City (2020–21) — extremely rare for a defender.' },
  { player: 'Roberto Carlos', fact: 'Roberto Carlos scored a famously impossible free-kick against France in 1997 — initially thought to be a fluke, it\'s now studied in physics textbooks.' },
  { player: 'Ronaldo (Brazilian)', fact: 'Ronaldo\'s boots reportedly went missing on the morning of the 1998 World Cup Final — fuelling decades of conspiracy theories about why he played so poorly.' },
  { player: 'Luis Suárez', fact: 'Suárez scored 31 Premier League goals in a single season for Liverpool (2013–14), finishing 2nd in the title race by just 2 points.' },
  { player: 'Robin van Persie', fact: 'Van Persie\'s diving header against Spain in the 2014 World Cup is considered one of the greatest goals ever scored.' },
  { player: 'Eusébio', fact: 'Eusébio scored 9 goals in the 1966 World Cup — still the record for a single African-born player at the tournament.' },
  { player: 'Romário', fact: 'Romário claimed to have scored 1,000 career goals — though the Brazilian football confederation officially counted 772.' },
  { player: 'Marcel Desailly', fact: 'Desailly won the Champions League and the World Cup in consecutive years (1994 with AC Milan, 1998 with France).' },
  { player: 'Fabio Cannavaro', fact: 'Cannavaro is the last defender to win the Ballon d\'Or — he did so in 2006 after captaining Italy to the World Cup.' },
  { player: 'Ricardo Kaká', fact: 'At his peak, Kaká was so dominant that Real Madrid paid €67 million for him in 2009 — then a world record for a midfielder.' },
  { player: 'Dani Alves', fact: 'Dani Alves won 43 major trophies during his career — the most by any professional footballer in history.' },
  { player: 'Philipp Lahm', fact: 'Lahm played his entire career at Bayern Munich and retired at 33 at the absolute peak of his powers — one of the most disciplined exits in football history.' },
  { player: 'Xabi Alonso', fact: 'Alonso scored a goal from the halfway line while playing for Liverpool against Luton Town in the FA Cup in 2006 — one of the most iconic long-range goals in history.' },
  { player: 'Michael Owen', fact: 'Owen won the Ballon d\'Or in 2001 aged just 21 — the youngest English winner and one of the youngest ever at that time.' },
  { player: 'Ruud van Nistelrooy', fact: 'Van Nistelrooy scored in 10 consecutive Champions League matches for Manchester United — still a record.' },
  { player: 'Raúl González', fact: 'Raúl was Real Madrid\'s all-time leading scorer before Cristiano Ronaldo arrived — he held the record for over a decade.' },
  { player: 'Hernán Crespo', fact: 'Crespo scored two goals in the 2005 Champions League Final for AC Milan — and STILL ended up on the losing side after Liverpool\'s legendary comeback.' },
  { player: 'Paolo Maldini', fact: 'Maldini played his 1000th game for AC Milan at age 38 and was still considered one of the best defenders in Serie A that season.' },
  { player: 'Alessandro Del Piero', fact: 'Del Piero scored the goal of the tournament at the 2006 World Cup — a curling finish against Germany in the semi-final in injury time.' },
  { player: 'Francesco Totti', fact: 'Totti played his entire career at Roma — 25 years. His final match was a send-off watched by 70,000 fans in tears in the stadium.' },
  { player: 'Andrea Pirlo', fact: 'Pirlo had the nickname "Il Maestro" but also "The Architect" — he once said he played with a glass of wine in his mind, always calm.' },
  { player: 'Franco Baresi', fact: 'Baresi played all 90 minutes of the 1994 World Cup Final while recovering from knee surgery — and the tournament was just weeks after his operation.' },
  { player: 'Pavel Nedvěd', fact: 'Nedvěd won the Ballon d\'Or in 2003 despite not playing in the Champions League Final — Juventus were knocked out in the semis.' },
  { player: 'Luis Figo', fact: 'Figo was pelted with a pig\'s head by Barcelona fans when he returned to the Nou Camp as a Real Madrid player — one of the most hostile receptions in football.' },
  { player: 'Clarence Seedorf', fact: 'Seedorf is the only player to have won the UEFA Champions League with three different clubs: Ajax, Real Madrid, and AC Milan.' },
  { player: 'Peter Shilton', fact: 'Shilton had the most England caps for 20+ years with 125 appearances — still the most by any outfield-or-goalkeeper in Three Lions history.' },
  { player: 'Ryan Giggs', fact: 'Giggs won the Premier League 13 times — more than any other player in football history, all with Manchester United.' },
  { player: 'Paul Scholes', fact: 'Scholes was so respected that Xavi called him "the best midfielder of his generation" — despite Scholes never winning the Champions League he deserved.' },
  { player: 'Roy Keane', fact: 'Keane was stripped of the Man United captaincy after a brutal interview criticising his own teammates live on the club\'s MUTV channel.' },
  { player: 'Filippo Inzaghi', fact: 'Inzaghi once said: "Every time I enter the penalty area, a penalty is given to me or I score." He was the ultimate poacher.' },
  { player: 'Ronaldinho', fact: 'In 2004, Ronaldinho did an advert for Nike where he hit the crossbar FOUR times in a row from outside the box — it was confirmed as real footage, not CGI.' },
  { player: 'Thierry Henry', fact: 'Henry once handled the ball to set up William Gallas for the goal that sent France to the 2010 World Cup — the "Hand of Thierry" still controversial in Ireland.' },
  { player: 'Wayne Rooney', fact: 'Rooney scored a bicycle kick against Manchester City in 2011 that was voted the best Premier League goal of all time in multiple polls.' },
  { player: 'Neymar', fact: 'Neymar is one of only 4 players to ever score 100+ goals for Barcelona, alongside Messi, Ronaldo, and Cruyff.' },
  { player: 'Zlatan Ibrahimović', fact: 'Ibrahimović scored goals in all 4 of the major European leagues — La Liga, Serie A, Ligue 1, and the Premier League. He did not need the Champions League to prove himself.' },
  { player: 'Eden Hazard', fact: 'Hazard\'s dribbling was so distinctive that defenders admitted guarding him was "impossible" — he once dribbled through the entire QPR team in a training session, per teammate testimony.' },
  { player: 'Gareth Bale', fact: 'Bale\'s overhead kick in the 2018 Champions League Final is widely regarded as the greatest bicycle kick ever scored in a major final.' },
  { player: 'Cesc Fàbregas', fact: 'Fàbregas debuted for Arsenal at 16 years old — and still holds the record as Arsenal\'s youngest-ever first-team goalscorer.' },
  { player: 'Carlos Tevez', fact: 'Tevez had an extraordinary journey — born in poverty in Buenos Aires, he was scarred by an accident as a child and went on to earn more than £300k/week at his peak.' },
  { player: 'Dimitar Berbatov', fact: 'Berbatov scored 5 goals for Manchester United in a single Premier League game against Blackburn in 2010 — one of them was an audacious backheeled volley.' },
  { player: 'Peter Schmeichel', fact: 'Schmeichel was so commanding that he once confronted Eric Cantona mid-game in the dressing room at half-time — Cantona apparently backed down.' },
  { player: 'Sadio Mané', fact: 'Mané grew up in a small village in Senegal that had no football pitch. He built one from local materials as a teenager and trained there every day.' },
  { player: 'N\'Golo Kanté', fact: 'Kanté is widely reported to have never been late for training in his entire professional career — one of the most respected professionals in the game.' },
  { player: 'Antoine Griezmann', fact: 'Griezmann is one of the few players to have scored in every round of a World Cup knockout stage in a single tournament (2018).' },
  { player: 'Riyad Mahrez', fact: 'Mahrez was playing in the French 4th division at age 21 — just 5 years later he was a Premier League champion and African Player of the Year.' },
  { player: 'Bernardo Silva', fact: 'Bernardo Silva went from being Benfica\'s youth academy player to becoming one of the most-wanted midfielders in world football, reportedly almost joining Barcelona multiple times.' },
  { player: 'Toni Kroos', fact: 'Kroos retired from international football after Germany\'s World Cup exit in 2018 — then came back for Euro 2024, and Germany reached the quarter-finals.' },
  { player: 'Sergio Ramos', fact: 'Ramos holds the record for most red cards in La Liga history (27) and Champions League history (twice). He is also Spain\'s most-capped outfield player.' },
  { player: 'Marcelo', fact: 'Marcelo won 25 major trophies with Real Madrid — more than any other player in the club\'s history.' },
  { player: 'Roberto Carlos', fact: 'Carlos\'s famous swerving free kick vs France in 1997 was originally ruled out due to a wall infringement — but the referee reversed his decision and allowed it.' },
  { player: 'Khvicha Kvaratskhelia', fact: 'Kvaratskhelia was sold by Napoli for €70 million to PSG in 2025 — despite having been bought for just €10 million two years earlier.' },
  { player: 'Rodri', fact: 'Rodri won the Ballon d\'Or in 2024 — the first holding midfielder to do so. He also went the entire Premier League season unbeaten with Man City in 2023–24.' },
  { player: 'Bukayo Saka', fact: 'Saka has been Arsenal\'s player of the season for multiple consecutive years despite being in his early 20s — marking him as one of Europe\'s most consistent wingers.' },
  { player: 'Lamine Yamal', fact: 'Yamal became the youngest player to score at a European Championship final (Euro 2024) aged just 17 — the day before his birthday.' },
  { player: 'Pedri', fact: 'Pedri won the Kopa Trophy (best under-21 player) and was nominated for the Ballon d\'Or at age 19 — the same year he played over 70 games across club and country.' },
  { player: 'Gavi', fact: 'Gavi is Barcelona\'s homegrown midfield maestro who won the Kopa Trophy in 2022 aged 18 — sometimes called the natural heir to Xavi\'s throne at the club.' },
  { player: 'Rafael Leão', fact: 'Leão reportedly had a release clause of €175 million in his AC Milan contract — making him one of the most valued players in Serie A history.' },
  { player: 'Achraf Hakimi', fact: 'Hakimi was born in Madrid but chose to represent Morocco — and led his country to the World Cup semi-final in 2022, the best-ever performance by an African nation.' },
];

// ─── Mode-specific DYK Facts ─────────────────────────────────────────────────

const NBA_FACTS = [
  { player: 'Michael Jordan', fact: 'Jordan went 6-for-6 in NBA Finals, never losing a series he reached — and won Finals MVP all six times.' },
  { player: 'LeBron James', fact: 'LeBron is the only player in NBA history to be the all-time leading scorer, rebounder, and assister among Finals MVPs.' },
  { player: 'Kareem Abdul-Jabbar', fact: 'Kareem\'s sky hook is considered the most unstoppable shot in NBA history — he scored 38,387 career points, a record that stood for nearly 40 years.' },
  { player: 'Wilt Chamberlain', fact: 'Wilt once scored 100 points in a single game (March 2, 1962). He also averaged 50.4 points per game for an entire season.' },
  { player: 'Magic Johnson', fact: 'Magic Johnson was a 6\'9" point guard who once started at center in the NBA Finals due to injury — and won Finals MVP.' },
  { player: 'Shaquille O\'Neal', fact: 'Shaq was so dominant the NBA changed its rules about defensive three-seconds specifically because of him — known as the "Hack-a-Shaq" era.' },
  { player: 'Kobe Bryant', fact: 'Kobe scored 81 points in a single game in 2006 — the second-highest single-game total in NBA history behind Wilt\'s 100.' },
  { player: 'Stephen Curry', fact: 'Steph Curry became the first unanimous MVP in NBA history (2016). He revolutionized basketball by making the 3-pointer the game\'s most valuable shot.' },
  { player: 'Larry Bird', fact: 'Bird won 3 consecutive MVP awards (1984–86) and led the Celtics to 3 championships while being the gold standard for trash-talking in NBA history.' },
  { player: 'Bill Russell', fact: 'Bill Russell won 11 NBA championships in 13 seasons — a record that will almost certainly never be broken.' },
  { player: 'Tim Duncan', fact: 'Tim Duncan was so consistent he was nicknamed "The Big Fundamental." He\'s the only player to make the All-NBA and All-Defensive teams in 13 consecutive seasons.' },
  { player: 'Kevin Durant', fact: 'KD won back-to-back Finals MVPs with the Warriors in 2017 and 2018 — averaging 35.2 and 28.8 points per game respectively.' },
  { player: 'Nikola Jokić', fact: 'Jokić became the first center to win three MVP awards since the 1980s, and led Denver to their first-ever NBA title in 2023.' },
  { player: 'Giannis Antetokounmpo', fact: 'Giannis turned down a supermax extension from the Bucks in 2021 before winning the championship that summer — the first Finals MVP of his career.' },
  { player: 'Russell Westbrook', fact: 'Westbrook holds the all-time record for most triple-doubles in NBA history with over 200 — breaking Oscar Robertson\'s record that stood since the 1960s.' },
  { player: 'Hakeem Olajuwon', fact: 'Hakeem "The Dream" Olajuwon once gave Michael Jordan a lesson in post moves during the offseason. Jordan then went on his "Dream Shake" tear the following year.' },
  { player: 'Charles Barkley', fact: 'Barkley was the only player selected to the 50 Greatest Players list who never won an NBA championship. He called it "the most embarrassing thing in my life."' },
  { player: 'Allen Iverson', fact: 'Iverson was the shortest MVP in NBA history at 6\'0". His crossover dribble was so effective the NBA tried to ban it — calling it a carry (and failed).' },
  { player: 'Dirk Nowitzki', fact: 'Dirk\'s one-legged fadeaway became one of the most distinctive shots in NBA history. He was the first European player to win Finals MVP.' },
  { player: 'Luka Dončić', fact: 'Luka became the youngest player to score 40+ points in a playoff game and is already in the all-time top 10 for points, assists, and rebounds per game in playoff history.' },
];

const WWE_FACTS = [
  { player: 'Hulk Hogan', fact: 'Hulk Hogan main-evented the first-ever WrestleMania in 1985 and is credited with turning professional wrestling into a global entertainment phenomenon.' },
  { player: 'Stone Cold Steve Austin', fact: 'Austin\'s "What?" catchphrase was so infectious it went viral before "viral" was a mainstream word — fans still chant it at every live event today.' },
  { player: 'The Rock', fact: 'Dwayne "The Rock" Johnson went from WWE Champion to the world\'s highest-paid actor. He is the first professional wrestler to earn over $100 million in a single year from entertainment.' },
  { player: 'The Undertaker', fact: 'The Undertaker\'s WrestleMania streak stood at 21-0 before Brock Lesnar ended it. WWE kept the streak loss secret so well that half the arena was reportedly in tears of shock.' },
  { player: 'John Cena', fact: 'John Cena has granted more Make-A-Wish Foundation wishes than anyone else in history — over 650 wishes granted, a record no one else is close to breaking.' },
  { player: 'Shawn Michaels', fact: 'HBK was the first man to win WWE\'s Royal Rumble from the #1 entry, eliminating all 29 other men in 1995 — considered one of the greatest Royal Rumble performances ever.' },
  { player: 'Bret Hart', fact: 'Bret "The Hitman" Hart is the only person to have won the WWF Championship, WCW Championship, and wrestled in both promotions in a main event.' },
  { player: 'Triple H', fact: 'Triple H holds the record for most reigns as World Heavyweight Champion at 13. He is now the executive running WWE\'s creative operations as Chief Content Officer.' },
  { player: 'Roman Reigns', fact: 'Roman Reigns\' "Tribal Chief" character held the Universal/WWE Championship for over 1,300 days — the longest combined reign in the modern era.' },
  { player: 'CM Punk', fact: 'CM Punk\'s 2011 "pipe bomb" promo is widely considered the most realistic and career-defining promo in WWE history — it briefly blurred the line between fiction and reality.' },
  { player: 'Randy Savage', fact: 'Macho Man Randy Savage is famous for the original Miss Elizabeth storyline, which pulled in some of the highest buyrates in wrestling history when they reunited at WrestleMania VII.' },
  { player: 'André the Giant', fact: 'André the Giant was reportedly impossible to knock unconscious from anesthesia due to his size — requiring doctors to calculate doses by trial during actual surgeries.' },
  { player: 'Becky Lynch', fact: 'Becky Lynch held both Raw and SmackDown Women\'s Championships simultaneously after WrestleMania 35 — the first woman to do so in WWE history.' },
  { player: 'Sasha Banks', fact: 'Sasha Banks is a five-time WWE Women\'s Champion and was the first Black woman to headline a main roster pay-per-view event in WWE.' },
  { player: 'Eddie Guerrero', fact: 'Eddie Guerrero\'s motto "Lie, Cheat and Steal" was so beloved by fans that when he won the WWE Championship in 2004, Madison Square Garden gave him a standing ovation.' },
];

const MUSIC_FACTS = [
  { player: 'Michael Jackson', fact: 'Thriller is the best-selling album of all time with over 70 million copies sold. The 14-minute music video cost $500,000 — an unprecedented amount in 1983.' },
  { player: 'Madonna', fact: 'Madonna is the best-selling female recording artist of all time with over 300 million records sold. She holds the record for highest-grossing concert tour for a female artist.' },
  { player: 'The Beatles', fact: 'The Beatles hold the record for most number-one hits on the Billboard Hot 100 with 20. They once occupied all top 5 spots simultaneously in 1964.' },
  { player: 'Elvis Presley', fact: 'Elvis Presley is the second best-selling music artist in history with over 600 million records sold. He never performed outside North America despite massive international fame.' },
  { player: 'Taylor Swift', fact: 'Taylor Swift\'s Eras Tour became the first concert tour to surpass $1 billion in revenue. She is also the first artist to have 5 albums reach 1 billion streams on Spotify simultaneously.' },
  { player: 'Beyoncé', fact: 'Beyoncé holds the record for most Grammy Awards won by any artist (32), surpassing Georg Solti\'s previous record of 31 set over a career spanning decades.' },
  { player: 'Tupac Shakur', fact: 'Tupac has sold more records posthumously than during his lifetime — releasing over 6 studio albums and 10+ compilations after his death in 1996.' },
  { player: 'The Notorious B.I.G.', fact: 'Biggie released only 2 studio albums before his death, yet is consistently ranked among the greatest rappers of all time by Rolling Stone and music critics worldwide.' },
  { player: 'Drake', fact: 'Drake holds the record for most entries on the Billboard Hot 100 by a single artist, surpassing even the Beatles with over 200 charted songs.' },
  { player: 'Kendrick Lamar', fact: 'Kendrick Lamar became the first rapper to win the Pulitzer Prize for Music in 2018 for his album DAMN. He is the only rapper to receive this honor.' },
  { player: 'Freddie Mercury', fact: 'Freddie Mercury\'s vocal range spanned nearly four octaves. He could sing notes that most trained classical singers cannot reach, yet never took formal vocal training.' },
  { player: 'David Bowie', fact: 'Bowie changed his name from David Jones to avoid confusion with Davy Jones of The Monkees. He also had heterochromia — his differently-colored eyes were from a pupil injury.' },
  { player: 'Eminem', fact: 'Eminem memorized the dictionary as a child to improve his rap vocabulary. He is the best-selling rap artist of all time with over 220 million records sold.' },
  { player: 'Jay-Z', fact: 'Jay-Z reportedly never writes down his lyrics — memorizing everything as he goes. He co-founded Tidal, the artist-owned streaming service, to give artists more control.' },
  { player: 'Rihanna', fact: 'Rihanna\'s Fenty Beauty line made more money in its first 40 days than Kylie Cosmetics did in its entire first year — becoming a $600 million brand almost overnight.' },
  { player: 'Bad Bunny', fact: 'Bad Bunny has been Spotify\'s most-streamed artist globally 3 years in a row (2020, 2021, 2022) — the first time any solo artist has achieved this three consecutive times.' },
  { player: 'BTS', fact: 'BTS is estimated to contribute $4.9 billion to the South Korean economy annually — roughly equivalent to having 26 mid-sized companies operating simultaneously.' },
  { player: 'Daft Punk', fact: 'Daft Punk wore robot helmets for nearly 30 years of their career without ever revealing their faces in public — one of the greatest maintained mysteries in pop music.' },
  { player: 'Burna Boy', fact: 'Burna Boy\'s Grammy win for Best Global Music Album in 2021 prompted Nigeria\'s President to tweet his congratulations — a rare intersection of music and national pride.' },
  { player: 'Adele', fact: 'Adele\'s album 21 spent 24 consecutive weeks at #1 in the UK and 24 weeks at #1 in the US — one of the longest chart-topping runs in music history.' },
];

const F1_FACTS = [
  { player: 'Lewis Hamilton', fact: 'Hamilton holds the records for most wins (103+), most pole positions (100+), and most podiums in F1 history. He equaled Schumacher\'s 7 titles in 2020.' },
  { player: 'Ayrton Senna', fact: 'Senna holds the highest win percentage (25%) of any driver with 30+ starts in F1 history. Many engineers who worked with him called him the fastest driver who ever lived.' },
  { player: 'Michael Schumacher', fact: 'Schumacher once won 13 races in a single season (2004) — a feat that stood as the record until Hamilton in 2020. His 72 career fastest laps is also an all-time record.' },
  { player: 'Max Verstappen', fact: 'Verstappen won 19 races in the 2023 season — the most wins in a single season in F1 history, surpassing the previous record of 15 set by Sebastian Vettel.' },
  { player: 'Sebastian Vettel', fact: 'Vettel won 4 consecutive World Championships from 2010-2013 and was the youngest driver to win the title when he first won aged 23.' },
  { player: 'Niki Lauda', fact: 'Niki Lauda survived a near-fatal crash at the 1976 German GP with severe burns, then returned to racing just 6 weeks later — losing the title by one point that very season.' },
  { player: 'Alain Prost', fact: 'Prost\'s precise, calculated driving style earned him the nickname "The Professor." He and Senna\'s rivalry is considered the greatest in F1 history.' },
  { player: 'Fernando Alonso', fact: 'Alonso is considered one of the most complete drivers in F1 history. At age 40+ he was still regularly outperforming cars that should have finished much lower.' },
  { player: 'Kimi Räikkönen', fact: 'Räikkönen is the most-capped driver in F1 history (349 starts) and holds the record for the longest gap between championship wins for a constructor (Ferrari, 2007 after a 16-year drought).' },
  { player: 'Charles Leclerc', fact: 'Leclerc is so talented he signed a multi-year Ferrari contract before winning a single race. He won at Monza (Ferrari\'s home track) in just his second season — ending a 9-year Ferrari drought there.' },
  { player: 'Lando Norris', fact: 'Lando Norris\'s 2024 Dutch GP win ended a multi-year drought for McLaren and made him the youngest British driver to win a grand prix in the modern era.' },
  { player: 'Jackie Stewart', fact: 'Jackie Stewart campaigned tirelessly for driver safety in the 1970s when F1 was genuinely life-threatening. His advocacy directly led to the Armco barriers, HANS devices, and safer circuits we have today.' },
  { player: 'Jim Clark', fact: 'Jim Clark won the 1963 championship by winning 7 out of 10 races — a dominance ratio not seen again until Schumacher and Vettel\'s peak years.' },
  { player: 'Damon Hill', fact: 'Damon Hill is the only son of a World Champion to also win the title. His father Graham Hill won in 1962 and 1968; Damon won in 1996.' },
  { player: 'Jenson Button', fact: 'Jenson Button\'s 2009 title was the most unlikely in years — he won 6 of the first 7 races with the Brawn GP team, a car designed in secret after Honda pulled out of F1.' },
];

const MOVIE_FACTS = [
  { player: 'Tom Hanks', fact: 'Tom Hanks is the only actor to win back-to-back Best Actor Oscars (1993–94) since Spencer Tracy did it in 1937–38. He was also the first major star to play a gay character in a Hollywood film (Philadelphia, 1993).' },
  { player: 'Meryl Streep', fact: 'Meryl Streep has been nominated for an Oscar 21 times — more than any other actor in history. She has won 3 times, also a record for acting categories.' },
  { player: 'Marlon Brando', fact: 'Brando famously refused his Best Actor Oscar for The Godfather in 1973, sending Native American activist Sacheen Littlefeather to decline the award on stage.' },
  { player: 'Audrey Hepburn', fact: 'Audrey Hepburn is one of only 16 people to achieve EGOT status (Emmy, Grammy, Oscar, Tony) and devoted her later life to UNICEF ambassador work in war-torn regions.' },
  { player: 'Leonardo DiCaprio', fact: 'DiCaprio was nominated for the Oscar 6 times before winning for The Revenant (2016). He ate a real raw bison liver for the role — despite being a vegetarian at the time.' },
  { player: 'Cate Blanchett', fact: 'Blanchett won Oscars in both Best Actress and Best Supporting Actress categories — making her one of only a handful of actors to achieve this double distinction.' },
  { player: 'Heath Ledger', fact: 'Heath Ledger\'s Joker in The Dark Knight was so immersive that he locked himself in a hotel room for a month to prepare. He became the first posthumous acting Oscar winner in 35 years.' },
  { player: 'Denzel Washington', fact: 'Denzel Washington is the first Black actor to win two Academy Awards — Best Supporting Actor (Glory, 1989) and Best Actor (Training Day, 2002).' },
  { player: 'Katharine Hepburn', fact: 'Katharine Hepburn won 4 Best Actress Oscars — a record that still stands today. She was also famous for never attending the ceremony once, yet kept all 4 statues.' },
  { player: 'Morgan Freeman', fact: 'Morgan Freeman was 52 years old before getting his first Best Actor nomination. His narrator voice is so distinctive that NASA considered using it for their public communications.' },
  { player: 'Joaquin Phoenix', fact: 'Joaquin Phoenix lost 52 pounds to play the Joker — so much that crew members reportedly became genuinely concerned about his mental and physical health during production.' },
  { player: 'Chadwick Boseman', fact: 'Chadwick Boseman filmed Black Panther, Avengers: Infinity War, and several other major projects while secretly battling stage 3 colon cancer — telling almost nobody on set.' },
  { player: 'Daniel Day-Lewis', fact: 'Day-Lewis is the only actor to win three Best Actor Oscars. He famously stays in character for the entire duration of a film shoot, sometimes for years of preparation.' },
  { player: 'Natalie Portman', fact: 'Natalie Portman began Harvard University the same year Star Wars Episode I came out, speaking 6 languages fluently. She has published peer-reviewed neuroscience research.' },
  { player: 'Viola Davis', fact: 'Viola Davis is one of only 18 people to achieve EGOT status and was the first Black woman to win the Emmy, Tony, and Oscar in acting categories.' },
];

// Lookup facts by game type prefix
const FACTS_BY_TYPE = {
  football: FOOTBALL_FACTS,
  nba: NBA_FACTS,
  wwe: WWE_FACTS,
  music: MUSIC_FACTS,
  f1: F1_FACTS,
  movies: MOVIE_FACTS,
};

function getFactsForMode(mode) {
  const type = (mode || 'football').split('-')[0];
  return FACTS_BY_TYPE[type] || FOOTBALL_FACTS;
}

// ─── GameBoard CSS ───────────────────────────────────────────────────────────
const GB_STYLES = `
  /* ── Shell ──────────────────────────────────────── */
  .gb-shell {
    min-height: 100vh;
    background: #070b14;
    background-image:
      radial-gradient(ellipse 80% 50% at 50% -5%, rgba(0,255,135,0.07) 0%, transparent 65%),
      radial-gradient(ellipse 50% 40% at 90% 90%, rgba(0,200,255,0.05) 0%, transparent 55%);
    color: #e8eaf0;
    font-family: 'Inter','Segoe UI',system-ui,sans-serif;
  }
  .gb-shell.gb-center {
    display: flex; align-items: center; justify-content: center;
  }
  .gb-inner {
    max-width: 900px;
    margin: 0 auto;
    padding: 16px 16px 60px;
  }

  /* ── Spinner ─────────────────────────────────────── */
  .gb-spinner-wrap {
    text-align: center;
  }
  .gb-spinner {
    width: 52px; height: 52px;
    border: 4px solid rgba(0,255,135,0.15);
    border-top-color: #00ff87;
    border-radius: 50%;
    animation: gbSpin 0.8s linear infinite;
    margin: 0 auto 20px;
  }
  .gb-spinner-title {
    display: block; font-size: 1.3rem; font-weight: 700; color: #fff; margin-bottom: 6px;
  }
  .gb-spinner-sub { display: block; color: #6b7280; font-size: 0.9rem; }

  /* ── Overlay cards (error / winner) ─────────────── */
  .gb-overlay-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 24px;
    padding: 40px 36px;
    text-align: center;
    max-width: 480px;
    width: 100%;
    margin: 20px;
  }
  .gb-overlay-title { font-size: 1.6rem; font-weight: 800; color: #fff; margin: 0 0 8px; }
  .gb-overlay-sub { color: #6b7280; margin: 0 0 24px; }
  .gb-winner-card { max-width: 520px; }
  .gb-winner-trophy { font-size: 4rem; margin-bottom: 8px; animation: gbBounce 1s ease infinite; }
  .gb-winner-title { font-size: 2rem; font-weight: 900; color: #fff; margin: 0 0 6px; text-transform: uppercase; }
  .gb-winner-name { font-size: 1.5rem; font-weight: 800; color: #00ff87; margin-bottom: 28px; }
  .gb-final-scores { margin-bottom: 28px; }
  .gb-score-row {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 14px; margin-bottom: 8px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px;
  }
  .gb-score-row--winner {
    background: rgba(0,255,135,0.08);
    border-color: rgba(0,255,135,0.3);
  }
  .gb-score-rank { color: #6b7280; font-size: 0.85rem; font-weight: 600; min-width: 28px; }
  .gb-score-pname { flex: 1; font-weight: 700; color: #e8eaf0; }
  .gb-score-pts { font-weight: 800; color: #00ff87; }

  /* ── Buttons ─────────────────────────────────────── */
  .gb-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    padding: 13px 22px; border: none; border-radius: 10px;
    font-size: 0.95rem; font-weight: 700; cursor: pointer;
    transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.04em;
  }
  .gb-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; }
  .gb-btn-green { background: linear-gradient(135deg,#00ff87,#00c853); color: #070b14; }
  .gb-btn-green:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,255,135,0.3); }
  .gb-btn-blue { background: linear-gradient(135deg,#00d4ff,#0080ff); color: #fff; }
  .gb-btn-blue:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,200,255,0.25); }
  .gb-btn-sent { background: rgba(0,255,135,0.15); color: #00ff87; border: 1px solid rgba(0,255,135,0.3); }
  .gb-btn-disabled { background: rgba(255,255,255,0.06); color: #4b5563; border: 1px solid rgba(255,255,255,0.08); }
  .gb-btn-row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
  .gb-icon-btn {
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px; padding: 8px 12px; color: #e8eaf0;
    cursor: pointer; font-size: 1rem; transition: all 0.2s;
  }
  .gb-icon-btn:hover { background: rgba(255,255,255,0.1); }

  /* ── DYK Popup ───────────────────────────────────── */
  .gb-dyk-overlay {
    position: fixed; inset: 0; z-index: 999;
    background: rgba(0,0,0,0.75); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: gbFadeIn 0.25s ease;
  }
  .gb-dyk-card {
    background: #0e1525;
    border: 1px solid rgba(0,255,135,0.25);
    border-radius: 20px;
    padding: 36px 32px;
    max-width: 480px;
    width: 100%;
    text-align: center;
    box-shadow: 0 0 60px rgba(0,255,135,0.1);
    animation: gbSlideUp 0.3s ease;
  }
  .gb-dyk-badge {
    display: inline-block;
    background: rgba(0,255,135,0.1);
    border: 1px solid rgba(0,255,135,0.3);
    color: #00ff87;
    font-size: 0.7rem; font-weight: 800;
    letter-spacing: 0.15em;
    padding: 5px 14px; border-radius: 20px;
    margin-bottom: 16px;
  }
  .gb-dyk-player {
    font-size: 1.2rem; font-weight: 800; color: #ffd700;
    margin-bottom: 14px;
  }
  .gb-dyk-fact {
    color: #9ba3b8; font-size: 1rem; line-height: 1.65;
    margin: 0 0 24px;
  }
  .gb-dyk-close { width: 100%; max-width: 220px; }

  /* ── Header ──────────────────────────────────────── */
  .gb-header {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 0 16px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    margin-bottom: 16px;
    flex-wrap: wrap;
    row-gap: 8px;
  }
  .gb-header-left { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .gb-logo {
    font-size: 1.4rem; font-weight: 900;
    background: linear-gradient(135deg,#00ff87,#00d4ff);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    white-space: nowrap;
  }
  .gb-logo-sub {
    font-size: 0.78rem; font-weight: 600; color: #6b7280;
    text-transform: uppercase; letter-spacing: 0.08em;
    white-space: nowrap;
    max-width: 110px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .gb-header-chips { display: flex; gap: 6px; flex: 1; flex-wrap: wrap; min-width: 0; }
  .gb-chip {
    font-size: 0.72rem; font-weight: 600;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px; padding: 4px 10px; color: #9ba3b8;
    white-space: nowrap;
  }
  .gb-chip--room { color: #e8eaf0; }
  .gb-chip--ok { color: #00ff87; border-color: rgba(0,255,135,0.3); background: rgba(0,255,135,0.08); }
  .gb-chip--warn { color: #f59e0b; border-color: rgba(245,158,11,0.3); background: rgba(245,158,11,0.08); }
  .gb-header-actions { display: flex; gap: 6px; }

  /* ── Letter section ──────────────────────────────── */
  .gb-letter-section {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 24px 20px;
    margin-bottom: 16px;
    text-align: center;
  }
  .gb-alpha-strip {
    display: flex; justify-content: center;
    gap: 4px; flex-wrap: wrap; margin-bottom: 20px;
  }
  .gb-alpha-tile {
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 6px; font-size: 11px; font-weight: 700;
    background: rgba(255,255,255,0.04);
    color: #374151;
    border: 1px solid transparent;
    transition: all 0.2s;
  }
  .gb-alpha-done {
    background: rgba(0,255,135,0.15);
    color: #00ff87;
    border-color: rgba(0,255,135,0.2);
  }
  .gb-alpha-current {
    background: rgba(0,255,135,0.2);
    color: #00ff87;
    border-color: #00ff87;
    transform: scale(1.18);
    box-shadow: 0 0 12px rgba(0,255,135,0.35);
    animation: gbPulse 1.5s ease-in-out infinite;
  }
  .gb-big-letter-wrap {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
  }
  .gb-big-letter {
    font-size: clamp(5rem, 18vw, 9rem);
    font-weight: 900;
    color: rgba(255,255,255,0.08);
    line-height: 1;
    text-shadow: none;
    transition: all 0.3s;
    letter-spacing: -0.02em;
  }
  .gb-big-letter--active {
    color: #fff;
    text-shadow: 0 0 60px rgba(0,255,135,0.5), 0 0 20px rgba(0,255,135,0.3);
    animation: gbLetterGlow 2s ease-in-out infinite;
  }
  .gb-letter-score-badge {
    background: rgba(255,215,0,0.1);
    border: 1px solid rgba(255,215,0,0.25);
    color: rgba(255,215,0,0.85);
    font-size: 0.72rem; font-weight: 700;
    padding: 3px 10px; border-radius: 10px;
    white-space: nowrap;
  }
  .gb-timer-row {
    display: flex; align-items: center; justify-content: center;
    gap: 16px; flex-wrap: wrap;
  }
  .gb-timer-circle {
    width: 72px; height: 72px;
    border-radius: 50%;
    border: 3px solid;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.4rem; font-weight: 900;
    flex-shrink: 0;
    transition: all 0.5s;
  }
  .gb-timer-bar-wrap {
    flex: 1; max-width: 280px; height: 8px;
    background: rgba(255,255,255,0.06);
    border-radius: 4px; overflow: hidden;
  }
  .gb-timer-bar-fill {
    height: 100%; border-radius: 4px;
  }
  .gb-pause-btn {
    padding: 8px 14px;
    background: rgba(245,158,11,0.15);
    border: 1px solid rgba(245,158,11,0.3);
    color: #f59e0b;
    border-radius: 8px; cursor: pointer;
    font-weight: 700; font-size: 0.85rem;
    transition: all 0.2s; white-space: nowrap;
  }
  .gb-pause-btn--resume {
    background: rgba(0,255,135,0.1);
    border-color: rgba(0,255,135,0.3);
    color: #00ff87;
  }
  .gb-paused-banner {
    margin-top: 14px;
    background: rgba(245,158,11,0.08);
    border: 1px solid rgba(245,158,11,0.25);
    border-radius: 10px;
    padding: 12px 16px;
    color: #f59e0b;
    font-size: 0.95rem;
    display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: center;
  }
  .gb-paused-resume { padding: 7px 16px; font-size: 0.82rem; }

  /* ── Input section ───────────────────────────────── */
  .gb-input-section {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 20px;
    margin-bottom: 16px;
  }
  .gb-start-wrap { text-align: center; }
  .gb-start-title { font-size: 1.1rem; font-weight: 700; color: #9ba3b8; margin-bottom: 14px; }
  .gb-start-btn { font-size: 1.1rem; padding: 15px 40px; }
  .gb-waiting {
    display: flex; align-items: center; gap: 10px;
    color: #6b7280; font-size: 0.9rem; justify-content: center;
    padding: 8px 0;
  }
  .gb-waiting-dot {
    width: 8px; height: 8px; border-radius: 50%; background: #00ff87;
    animation: gbBlink 1s ease-in-out infinite;
  }
  .gb-answer-row {
    display: flex; gap: 10px; margin-bottom: 12px;
  }
  .gb-answer-input {
    flex: 1; padding: 14px 16px;
    background: rgba(255,255,255,0.06);
    border: 1.5px solid rgba(255,255,255,0.12);
    border-radius: 12px;
    font-size: 1.05rem; color: #e8eaf0;
    transition: all 0.2s;
  }
  .gb-answer-input::placeholder { color: #4b5563; }
  .gb-answer-input:focus {
    outline: none;
    border-color: #00ff87;
    box-shadow: 0 0 0 3px rgba(0,255,135,0.12);
    background: rgba(0,255,135,0.04);
  }
  .gb-answer-input--sent {
    border-color: rgba(0,255,135,0.3);
    background: rgba(0,255,135,0.06);
  }
  .gb-answer-input--paused {
    border-color: rgba(245,158,11,0.25);
    background: rgba(245,158,11,0.04);
  }
  .gb-submit-btn { flex-shrink: 0; min-width: 110px; }
  .gb-btn-skip { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #9ba3b8; }
  .gb-btn-skip:hover { background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.25); color: #f59e0b; }
  .gb-skip-btn { flex-shrink: 0; }
  .gb-message {
    border-radius: 10px; padding: 12px 16px;
    font-weight: 700; font-size: 0.95rem;
    margin-top: 6px;
  }
  .gb-msg-ok { background: rgba(0,255,135,0.1); border: 1px solid rgba(0,255,135,0.25); color: #00ff87; }
  .gb-msg-err { background: rgba(255,68,68,0.1); border: 1px solid rgba(255,68,68,0.25); color: #ff6b6b; }
  .gb-msg-info { background: rgba(0,200,255,0.08); border: 1px solid rgba(0,200,255,0.2); color: #7dd3fc; }

  /* ── Sections ────────────────────────────────────── */
  .gb-section {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 20px;
    margin-bottom: 16px;
  }
  .gb-section-title {
    font-size: 1rem; font-weight: 700; color: #9ba3b8;
    text-transform: uppercase; letter-spacing: 0.07em;
    margin: 0 0 16px;
    display: flex; align-items: center; gap: 8px;
  }
  .gb-accent { color: #00ff87; }
  .gb-count {
    background: rgba(0,255,135,0.1);
    border: 1px solid rgba(0,255,135,0.2);
    color: #00ff87;
    padding: 2px 8px; border-radius: 10px;
    font-size: 0.8rem;
  }

  /* ── Players grid ────────────────────────────────── */
  .gb-players-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
  }
  .gb-player-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 14px 16px;
    transition: all 0.2s;
  }
  .gb-player-card--you {
    border-color: rgba(0,255,135,0.3);
    background: rgba(0,255,135,0.05);
    box-shadow: 0 0 20px rgba(0,255,135,0.08);
  }
  .gb-player-top {
    display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
  }
  .gb-player-rank { color: #4b5563; font-size: 0.78rem; font-weight: 700; min-width: 22px; }
  .gb-player-name {
    flex: 1; font-weight: 700; color: #e8eaf0; font-size: 0.95rem;
    display: flex; align-items: center; gap: 6px;
  }
  .gb-you-badge {
    font-size: 0.65rem; font-weight: 800;
    background: rgba(0,255,135,0.15); color: #00ff87;
    border: 1px solid rgba(0,255,135,0.3);
    padding: 1px 6px; border-radius: 6px; letter-spacing: 0.05em;
  }
  .gb-player-pts {
    font-weight: 900; color: #ffd700; font-size: 1rem;
    white-space: nowrap;
  }
  .gb-player-pts span { font-size: 0.65rem; color: #6b7280; margin-left: 2px; }
  .gb-player-status {
    font-size: 0.82rem; color: #4b5563;
    background: rgba(255,255,255,0.03);
    border-radius: 6px; padding: 5px 8px;
  }
  .gb-status-ok      { color: #00ff87; background: rgba(0,255,135,0.06); }
  .gb-status-err     { color: #ff6b6b; background: rgba(255,68,68,0.06); }
  .gb-status-partial { color: #f59e0b; background: rgba(245,158,11,0.06); }

  /* ── Round Results ───────────────────────────────── */
  .gb-results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 10px;
  }
  .gb-result-card {
    border-radius: 12px; padding: 14px; text-align: center;
    border: 1px solid;
  }
  .gb-result-card--ok {
    background: rgba(0,255,135,0.06);
    border-color: rgba(0,255,135,0.25);
  }
  .gb-result-card--err {
    background: rgba(255,68,68,0.06);
    border-color: rgba(255,68,68,0.2);
  }
  .gb-result-player { font-weight: 700; color: #e8eaf0; margin-bottom: 5px; }
  .gb-result-answer { color: #9ba3b8; font-size: 0.9rem; margin-bottom: 5px; }
  .gb-result-pts { font-weight: 800; font-size: 0.9rem; }
  .gb-result-card--ok .gb-result-pts { color: #00ff87; }
  .gb-result-card--err .gb-result-pts { color: #ff6b6b; }

  /* ── Stats bar ───────────────────────────────────── */
  .gb-stats-bar {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 16px;
  }
  .gb-stat-item {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    padding: 12px 8px;
    text-align: center;
  }
  .gb-stat-val { display: block; font-weight: 800; font-size: 1.15rem; color: #00ff87; line-height: 1; margin-bottom: 4px; }
  .gb-stat-lbl { font-size: 0.68rem; color: #4b5563; text-transform: uppercase; letter-spacing: 0.08em; }

  /* ── Tags (used players) ─────────────────────────── */
  .gb-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .gb-tag {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    color: #6b7280;
    font-size: 0.8rem;
    padding: 4px 10px; border-radius: 12px;
  }
  .gb-tag--more {
    background: rgba(0,255,135,0.08);
    border-color: rgba(0,255,135,0.2);
    color: #00ff87;
  }

  /* ── Keyframes ───────────────────────────────────── */
  @keyframes gbSpin { to { transform: rotate(360deg); } }
  @keyframes gbBounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  @keyframes gbPulse { 0%,100% { box-shadow: 0 0 12px rgba(0,255,135,0.3); } 50% { box-shadow: 0 0 20px rgba(0,255,135,0.55); } }
  @keyframes gbLetterGlow { 0%,100% { text-shadow: 0 0 40px rgba(0,255,135,0.35); } 50% { text-shadow: 0 0 80px rgba(0,255,135,0.65), 0 0 30px rgba(0,255,135,0.4); } }
  @keyframes gbFadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes gbSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes gbBlink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

  /* ── Responsive ──────────────────────────────────── */
  @media (max-width: 600px) {
    .gb-answer-row { flex-direction: column; }
    .gb-submit-btn { width: 100%; }
    .gb-stats-bar { grid-template-columns: repeat(2, 1fr); }
    .gb-header { justify-content: flex-start; }
    .gb-header-chips { display: none; }  /* room + mode chips hidden on small screens — saves space */
    .gb-header-actions { margin-left: auto; }
    .gb-timer-row { gap: 8px; }
    .gb-timer-bar-wrap { max-width: 140px; }
    .gb-letter-score-badge { font-size: 0.65rem; }
  }
`;

// ── Mode display helpers ───────────────────────────────────────────────────────
function getModeLabel(gameMode) {
  const [type, sub, era] = (gameMode || 'football-modern').split('-');
  const labels = {
    football: { icons: '🏆 Icons', modern: '⚡ Modern', default: '⚽ Football' },
    nba:      { legends: '🏆 Legends', modern: '⚡ Modern', default: '🏀 NBA' },
    wwe:      { all: '🌎 All Eras', golden: '👑 Golden', attitude: '🔥 Attitude', ruthless: '⚡ Ruthless', pg: '🛡️ PG Era', modern: '🚀 Modern', default: '🤼 WWE' },
    music:    { default: '🎵 Music' },
    f1:       { legends: '🏆 Legends', modern: '⚡ Modern', default: '🏎️ F1' },
    movies:   { classic: '🎞️ Classic', modern: '⚡ Modern', default: '🎬 Movies' },
  };
  const typeLabels = labels[type] || labels.football;
  if (type === 'music') {
    const genre = sub ? sub.charAt(0).toUpperCase() + sub.slice(1) : 'All';
    const eraStr = era ? (era === 'classic' ? '🕰️ Classic' : '⚡ Modern') : '';
    return `🎵 ${genre}${eraStr ? ' · ' + eraStr : ''}`;
  }
  return typeLabels[sub] || typeLabels.default || gameMode;
}

function getEntityLabel(gameMode) {
  const type = (gameMode || '').split('-')[0];
  const map = { football: 'Player', nba: 'Player', wwe: 'Superstar', music: 'Artist', f1: 'Driver', movies: 'Actor' };
  return map[type] || 'Name';
}

const GameBoard = ({ roomId, playerName, gameMode = 'football-modern' }) => {
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
  const [isValidating, setIsValidating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedBy, setPausedBy] = useState(null);
  
  // liveGameMode starts from prop but syncs to server's room gameMode once snapshot arrives.
  // This lets joiners (who have no mode in their URL) pick up the room's actual mode.
  const [liveGameMode, setLiveGameMode] = useState(gameMode);
  // Ref keeps the current liveGameMode accessible from effects without adding it to deps
  const liveGameModeRef = useRef(gameMode);

  const [showFact, setShowFact] = useState(false);
  const [currentFact, setCurrentFact] = useState(null);

  const fuseRef = useRef(null);
  const socketRef = useRef(null);
  const playerDatabaseRef = useRef([]);
  const usedFactIndicesRef = useRef([]);

  // Strips diacritics / stylized chars — used for DB/Fuse comparison.
  // Maps common artistic substitutions so "Ke$ha" → "kesha", etc.
  const normalizePlayerName = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\$/g, 's')   // Ke$ha → kesha
      .replace(/\!/g, 'i')   // P!nk → pink
      .replace(/\@/g, 'a')
      .replace(/3/g, 'e')    // br3akthrough typos
      .replace(/0/g, 'o')
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
          
          // Send gameMode so server stores it on room creation (creator's mode)
          newSocket.emit('join-room', { roomId, playerName, gameMode });
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
          // Sync the live game mode from the server's room state.
          // Critical for joiners who don't have ?mode= in their URL.
          if (state.gameMode && state.gameMode !== liveGameMode) {
            setLiveGameMode(state.gameMode);
            liveGameModeRef.current = state.gameMode;
          }
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
          setIsValidating(false);
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
          setGameState(prev => {
            // Fire confetti based on this player's final rank
            import('canvas-confetti').then(m => {
              const confetti = m.default;
              const sorted = Object.entries(data.scores || {}).sort(([,a],[,b]) => b - a);
              const rank = sorted.findIndex(([p]) => p === playerName);
              if (rank === 0) {
                // Winner — big burst + side cannons
                confetti({ particleCount: 180, spread: 100, origin: { y: 0.55 } });
                setTimeout(() => confetti({ particleCount: 80, angle: 60,  spread: 60, origin: { x: 0, y: 0.6 } }), 300);
                setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 60, origin: { x: 1, y: 0.6 } }), 500);
              } else if (rank === 1) {
                confetti({ particleCount: 90, spread: 70, origin: { y: 0.55 } });
              } else if (rank === 2) {
                confetti({ particleCount: 45, spread: 50, origin: { y: 0.55 } });
              }
            }).catch(() => {});
            return { ...prev, scores: data.scores || prev.scores, winner: data.winner, isActive: false };
          });
        });

        newSocket.on('error-message', (data) => {
          setMessage(`❌ ${data.message}`);
          setTimeout(() => setMessage(''), 5000);
        });

        newSocket.on('player-left', (data) => {
          setMessage(`👋 ${data.playerName} left`);
          setTimeout(() => setMessage(''), 3000);
        });

        newSocket.on('game-paused', (data) => {
          setIsPaused(true);
          setPausedBy(data.pausedBy);
          setGameState(prev => ({ ...prev, timer: data.timer }));
        });

        newSocket.on('game-resumed', (data) => {
          setIsPaused(false);
          setPausedBy(null);
          setGameState(prev => ({ ...prev, timer: data.timer }));
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
        console.log(`📊 Loading ${liveGameMode} players...`);

        // Pass the full compound mode string (e.g. "football-modern", "nba-legends", "music-hiphop-modern")
        // Backwards-compat: bare 'icons'/'modern'/'legacy' still work via the API route
        const apiUrl = `/api/players/${liveGameMode}`;
        
        console.log('🔗 Fetching from:', apiUrl);
        const response = await fetch(apiUrl);
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`API failed: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✅ Loaded ${data.length} players for ${liveGameMode} mode`);
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
  }, [liveGameMode]);

  // Show a DYK fact once per calendar day per mode, only after players actually loaded.
  // Uses liveGameModeRef so it always reads the current mode without being in deps
  // (avoids firing twice if liveGameMode syncs from server after load completes).
  useEffect(() => {
    if (!isLoading && playerDatabaseRef.current.length > 0) {
      const mode = liveGameModeRef.current;
      const today = new Date().toDateString();
      const type = (mode || 'football').split('-')[0];
      const storageKey = `az_fact_${type}`;
      try {
        const lastDate = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
        if (lastDate !== today) {
          showRandomFact(mode);
          if (typeof window !== 'undefined') localStorage.setItem(storageKey, today);
        }
      } catch { /* localStorage unavailable in some envs */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const handleStartGame = () => {
    if (!socket || connectionStatus !== 'connected') {
      setMessage('❌ Not connected!');
      return;
    }
    
    console.log('🚀 Starting game...');
    socket.emit('start-game', { roomId });
    setMessage('🎮 Starting...');
  };

  const handlePauseGame = () => {
    if (!socket || !gameState.isActive || isPaused) return;
    socket.emit('pause-game', { roomId });
  };

  const handleResumeGame = () => {
    if (!socket || !isPaused) return;
    socket.emit('resume-game', { roomId });
  };

  // Show a random DYK fact — uses facts for the active game mode
  const showRandomFact = (mode) => {
    const facts = getFactsForMode(mode || liveGameMode);
    if (facts.length === 0) return;
    if (usedFactIndicesRef.current.length >= facts.length) {
      usedFactIndicesRef.current = [];
    }
    const available = facts.map((_, i) => i).filter(
      i => !usedFactIndicesRef.current.includes(i)
    );
    const pick = available[Math.floor(Math.random() * available.length)];
    usedFactIndicesRef.current.push(pick);
    setCurrentFact(facts[pick]);
    setShowFact(true);
  };

  // Get top Fuse candidates (without committing to a match) for Claude context
  const getFuseCandidates = (normalizedInput) => {
    if (!fuseRef.current || playerDatabaseRef.current.length === 0) return [];
    const results = fuseRef.current.search(normalizedInput);
    return results.slice(0, 5).map(r => ({
      name: playerDatabaseRef.current[r.refIndex],
      score: r.score,
    }));
  };

  // Call Claude API to validate; returns null on failure (triggers fallback)
  const askClaude = async (input, letter, candidates) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout
      const res = await fetch('/api/validate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, letter, gameMode: liveGameMode, candidates }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null; // timeout or network error → fall back to Fuse
    }
  };

  const handleSkipTurn = () => {
    if (submitted || isValidating || !socket || !gameState.isActive || isPaused) return;
    setSubmitted(true);
    setMessage('⏭ Skipped — 0 pts');
    socket.emit('submit-answer', {
      roomId,
      playerName,
      answer: '[skip]',
      isValid: false,
      matchedPlayer: null,
      points: 0,
    });
  };

  const handleSubmitAnswer = async () => {
    if (submitted || isValidating || !socket || !gameState.isActive) return;

    const answer = playerInput.trim();
    if (!answer) return;

    const letter = gameState.currentLetter;
    const fullPoints = LETTER_SCORES[letter] || 1;

    // ── Step 1: Run local validation (sync, instant) ─────────────────────────
    const localResult = validatePlayer(answer, letter);

    // If local result is a clear exact match, skip Claude to save latency
    const isClearExact = localResult.valid && !localResult.isPartial;

    let validation = localResult;

    if (!isClearExact) {
      // ── Step 2: Ask Claude for uncertain / no-match cases ──────────────────
      setIsValidating(true);
      setMessage('🤔 Checking…');

      const normalizedInput = normalizePlayerName(answer);
      const candidates = getFuseCandidates(normalizedInput);
      const claudeResult = await askClaude(answer, letter, candidates);

      setIsValidating(false);

      if (claudeResult && typeof claudeResult.valid === 'boolean') {
        // Claude succeeded — use its result
        validation = {
          valid: claudeResult.valid,
          matchedPlayer: claudeResult.matchedName || answer,
          isPartial: claudeResult.isPartial || false,
          source: 'claude',
        };
        console.log('🤖 Claude validation:', claudeResult);
      } else {
        // Claude failed or timed out — stick with local Fuse result
        console.log('⚠️ Claude unavailable, using local Fuse result');
      }
    }

    setSubmitted(true);
    console.log('📝 Final validation:', validation);
    console.log('🎯 Player database size:', playerDatabaseRef.current.length);

    const points = validation.valid
      ? (validation.isPartial ? Math.max(1, Math.floor(fullPoints / 2)) : fullPoints)
      : 0;

    socket.emit('submit-answer', {
      roomId,
      playerName,
      answer,
      isValid: validation.valid,
      matchedPlayer: validation.matchedPlayer,
      points,
    });

    if (validation.valid) {
      if (validation.isPartial) {
        setMessage(`⚡ Close! "${validation.matchedPlayer}" — ${points} pts (half)`);
      } else {
        setMessage(`✅ "${validation.matchedPlayer}" — ${points} pts`);
      }
    } else {
      setMessage(`❌ "${answer}" — not found`);
    }
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
            // Word-fuzzy guard: input must fuzzy-match at least one word in the
            // matched name (prefix OR Levenshtein within tolerance). This allows
            // typos like "Lewandowsky" → "Lewandowski" while still blocking
            // unrelated matches like "dinho" → "Ronaldinho" in the D round.
            if (!wordFuzzyMatch(normalizedMatched, normalizedInput)) continue;

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
              // Partial scoring: very close (score < 0.2) = full points
              //                  fuzzy match (score 0.2–0.6)  = half points
              const isPartial = result.score >= 0.2;
              console.log(`✅ ${isPartial ? 'Partial' : 'Exact'} match: "${trimmedInput}" -> "${matchedPlayer}" (score: ${result.score.toFixed(3)})`);
              return { valid: true, matchedPlayer, isPartial };
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

  // ── Loading screen ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="gb-shell gb-center">
        <div className="gb-spinner-wrap">
          <div className="gb-spinner" />
          <div className="gb-spinner-text">
            <span className="gb-spinner-title">Loading Game…</span>
            <span className="gb-spinner-sub">Fetching {getModeLabel(liveGameMode)} names…</span>
          </div>
        </div>
        <style jsx>{GB_STYLES}</style>
      </div>
    );
  }

  // ── Error screen ──────────────────────────────────────────────────────────
  if (connectionStatus === 'error') {
    return (
      <div className="gb-shell gb-center">
        <div className="gb-overlay-card">
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🚫</div>
          <h2 className="gb-overlay-title">Connection Error</h2>
          <p className="gb-overlay-sub">Cannot reach game server</p>
          <button className="gb-btn gb-btn-green" onClick={() => window.location.reload()}>
            🔄 Retry
          </button>
        </div>
        <style jsx>{GB_STYLES}</style>
      </div>
    );
  }

  // ── Game complete ─────────────────────────────────────────────────────────
  if (gameState.winner) {
    const sortedScores = Object.entries(gameState.scores).sort(([, a], [, b]) => b - a);
    return (
      <div className="gb-shell gb-center">
        <div className="gb-overlay-card gb-winner-card">
          <div className="gb-winner-trophy">🏆</div>
          <h1 className="gb-winner-title">Game Over!</h1>
          <div className="gb-winner-name">{gameState.winner} Wins!</div>
          <div className="gb-final-scores">
            {sortedScores.map(([player, score], i) => (
              <div
                key={player}
                className={`gb-score-row ${player === gameState.winner ? 'gb-score-row--winner' : ''}`}
              >
                <span className="gb-score-rank">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </span>
                <span className="gb-score-pname">{player}</span>
                <span className="gb-score-pts">{score} pts</span>
              </div>
            ))}
          </div>
          <div className="gb-btn-row">
            <button className="gb-btn gb-btn-green" onClick={() => window.location.reload()}>
              🎮 Play Again
            </button>
            <button className="gb-btn gb-btn-blue" onClick={() => { window.location.href = '/'; }}>
              🏠 Home
            </button>
          </div>
        </div>
        <style jsx>{GB_STYLES}</style>
      </div>
    );
  }

  // ── Main game ─────────────────────────────────────────────────────────────
  const gameInProgress = gameState.gameStarted && !gameState.winner;
  const showStartButton = Object.keys(gameState.players).length >= 1 && !gameState.isActive && !gameInProgress;
  const showWaitingBetweenRounds = gameInProgress && !gameState.isActive;
  const playerCount = Object.keys(gameState.players).length;
  const timerPct = (gameState.timer / 30) * 100;
  const timerColor = gameState.timer <= 10 ? '#ff4444' : gameState.timer <= 20 ? '#f59e0b' : '#00ff87';

  return (
    <div className="gb-shell">

      {/* ── DYK Fact Popup ── */}
      {showFact && currentFact && (
        <div className="gb-dyk-overlay" onClick={() => setShowFact(false)}>
          <div className="gb-dyk-card" onClick={e => e.stopPropagation()}>
            <div className="gb-dyk-badge">⚡ DID YOU KNOW?</div>
            <div className="gb-dyk-player">{currentFact.player}</div>
            <p className="gb-dyk-fact">{currentFact.fact}</p>
            <button className="gb-btn gb-btn-green gb-dyk-close" onClick={() => setShowFact(false)}>
              Got it →
            </button>
          </div>
        </div>
      )}

      <div className="gb-inner">

        {/* ── Header ── */}
        <header className="gb-header">
          <div className="gb-header-left">
            <span className="gb-logo">A–Z</span>
            <span className="gb-logo-sub">{getModeLabel(liveGameMode)}</span>
          </div>
          <div className="gb-header-chips">
            <span className="gb-chip">{getModeLabel(liveGameMode)}</span>
            <span className="gb-chip gb-chip--room">🏠 {roomId}</span>
            <span className={`gb-chip gb-chip--status ${connectionStatus === 'connected' ? 'gb-chip--ok' : 'gb-chip--warn'}`}>
              {connectionStatus === 'connected' ? '● Live' : '◌ …'}
            </span>
          </div>
          <div className="gb-header-actions">
            <button
              className="gb-icon-btn"
              title="Copy share link"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setMessage('📋 Link copied!');
                setTimeout(() => setMessage(''), 3000);
              }}
            >🔗</button>
            <button className="gb-icon-btn" title="Home" onClick={() => { window.location.href = '/'; }}>🏠</button>
          </div>
        </header>

        {/* ── Letter + Timer + Progress ── */}
        <section className="gb-letter-section">
          {/* Alphabet progress */}
          <div className="gb-alpha-strip">
            {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map((l, i) => (
              <span
                key={l}
                className={`gb-alpha-tile ${i < gameState.currentLetterIndex ? 'gb-alpha-done' : i === gameState.currentLetterIndex ? 'gb-alpha-current' : ''}`}
              >{l}</span>
            ))}
          </div>

          {/* Big letter */}
          <div className="gb-big-letter-wrap">
            <div className={`gb-big-letter ${gameState.isActive ? 'gb-big-letter--active' : ''}`}>
              {gameState.currentLetter}
            </div>
            <div className="gb-letter-score-badge">
              {LETTER_SCORES[gameState.currentLetter]} pts
            </div>
          </div>

          {/* Timer row */}
          {gameState.isActive && (
            <div className="gb-timer-row">
              <div
                className="gb-timer-circle"
                style={{ background: isPaused ? 'rgba(245,158,11,0.15)' : `rgba(${gameState.timer <= 10 ? '255,68,68' : '0,255,135'},0.1)`, borderColor: isPaused ? '#f59e0b' : timerColor, color: isPaused ? '#f59e0b' : timerColor }}
              >
                {isPaused ? '⏸' : `${gameState.timer}`}
              </div>
              <div className="gb-timer-bar-wrap">
                <div
                  className="gb-timer-bar-fill"
                  style={{
                    width: `${timerPct}%`,
                    background: isPaused ? '#f59e0b' : timerColor,
                    transition: isPaused ? 'none' : 'width 1s linear',
                    boxShadow: isPaused ? 'none' : `0 0 8px ${timerColor}60`,
                  }}
                />
              </div>
              <button
                className={`gb-pause-btn ${isPaused ? 'gb-pause-btn--resume' : ''}`}
                onClick={isPaused ? handleResumeGame : handlePauseGame}
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? '▶ Resume' : '⏸'}
              </button>
            </div>
          )}

          {/* Paused banner */}
          {gameState.isActive && isPaused && (
            <div className="gb-paused-banner">
              ⏸ Paused by <strong>{pausedBy}</strong>
              <button className="gb-btn gb-btn-green gb-paused-resume" onClick={handleResumeGame}>▶ Resume</button>
            </div>
          )}
        </section>

        {/* ── Input / Start / Waiting ── */}
        <section className="gb-input-section">
          {showStartButton && (
            <div className="gb-start-wrap">
              <div className="gb-start-title">⚽ {playerCount} Player{playerCount !== 1 ? 's' : ''} Ready</div>
              <button
                className="gb-btn gb-btn-green gb-start-btn"
                onClick={handleStartGame}
                disabled={connectionStatus !== 'connected'}
              >
                🚀 Kick Off!
              </button>
            </div>
          )}

          {showWaitingBetweenRounds && !showFact && (
            <div className="gb-waiting">
              <span className="gb-waiting-dot" />
              Next round starting… ({gameState.currentLetterIndex + 1}/26)
            </div>
          )}

          {gameState.isActive && (
            <div className="gb-answer-row">
              <input
                type="text"
                className={`gb-answer-input ${submitted || isValidating ? 'gb-answer-input--sent' : isPaused ? 'gb-answer-input--paused' : ''}`}
                value={playerInput}
                onChange={e => setPlayerInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !isPaused && !isValidating && handleSubmitAnswer()}
                placeholder={`${getEntityLabel(liveGameMode)} starting with ${gameState.currentLetter}…`}
                disabled={submitted || isValidating || isPaused}
                autoComplete="off"
                autoFocus
              />
              <button
                className={`gb-btn ${submitted ? 'gb-btn-sent' : isValidating ? 'gb-btn-disabled' : isPaused ? 'gb-btn-disabled' : 'gb-btn-green'} gb-submit-btn`}
                onClick={handleSubmitAnswer}
                disabled={submitted || isValidating || !playerInput.trim() || isPaused}
              >
                {submitted ? '✅ Sent' : isValidating ? '🤔…' : isPaused ? '⏸' : 'Submit →'}
              </button>
              {!submitted && !isValidating && !isPaused && (
                <button
                  className="gb-btn gb-btn-skip gb-skip-btn"
                  onClick={handleSkipTurn}
                  title="Skip this letter (0 points)"
                >
                  ⏭ Skip
                </button>
              )}
            </div>
          )}

          {message && (
            <div className={`gb-message ${message.includes('✅') ? 'gb-msg-ok' : message.includes('❌') ? 'gb-msg-err' : 'gb-msg-info'}`}>
              {message}
            </div>
          )}
        </section>

        {/* ── Players ── */}
        <section className="gb-section">
          <h3 className="gb-section-title">👥 Players <span className="gb-count">{playerCount}</span></h3>
          <div className="gb-players-grid">
            {Object.entries(gameState.players).map(([name]) => {
              const ans = gameState.roundAnswers[name];
              const isYou = name === playerName;
              const rank = Object.entries(gameState.scores).sort(([, a], [, b]) => b - a).findIndex(([n]) => n === name) + 1;
              return (
                <div key={name} className={`gb-player-card ${isYou ? 'gb-player-card--you' : ''}`}>
                  <div className="gb-player-top">
                    <div className="gb-player-rank">#{rank}</div>
                    <div className="gb-player-name">{name}{isYou && <span className="gb-you-badge">YOU</span>}</div>
                    <div className="gb-player-pts">{gameState.scores[name] || 0}<span>pts</span></div>
                  </div>
                  <div className={`gb-player-status ${ans ? (ans.isValid ? (ans.points < LETTER_SCORES[gameState.currentLetter] ? 'gb-status-partial' : 'gb-status-ok') : 'gb-status-err') : ''}`}>
                    {ans
                      ? `${ans.isValid ? (ans.points < LETTER_SCORES[gameState.currentLetter] ? '⚡' : '✅') : '❌'} ${ans.answer}${ans.isValid && ans.points ? ` (+${ans.points})` : ''}`
                      : gameState.isActive ? '⏳ Thinking…' : '— Ready'}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Round Results ── */}
        {Object.keys(gameState.roundAnswers).length > 0 && !gameState.isActive && (
          <section className="gb-section">
            <h3 className="gb-section-title">🏁 Round Results — <span className="gb-accent">{gameState.currentLetter}</span></h3>
            <div className="gb-results-grid">
              {Object.entries(gameState.roundAnswers).map(([player, result]) => (
                <div key={player} className={`gb-result-card ${result.isValid ? 'gb-result-card--ok' : 'gb-result-card--err'}`}>
                  <div className="gb-result-player">{player}</div>
                  <div className="gb-result-answer">{result.answer || '—'}</div>
                  <div className="gb-result-pts">
                    {result.isValid ? `+${result.points} pts` : '✗ invalid'}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Stats Bar ── */}
        <section className="gb-stats-bar">
          <div className="gb-stat-item"><span className="gb-stat-val">{playerCount}</span><span className="gb-stat-lbl">Players</span></div>
          <div className="gb-stat-item"><span className="gb-stat-val">{gameState.currentLetterIndex + 1}/26</span><span className="gb-stat-lbl">Letter</span></div>
          <div className="gb-stat-item"><span className="gb-stat-val">{gameState.usedPlayers?.length || 0}</span><span className="gb-stat-lbl">Named</span></div>
          <div className="gb-stat-item"><span className="gb-stat-val">{Math.round(((gameState.currentLetterIndex + 1) / 26) * 100)}%</span><span className="gb-stat-lbl">Done</span></div>
        </section>

        {/* ── Used Players ── */}
        {gameState.usedPlayers && gameState.usedPlayers.length > 0 && (
          <section className="gb-section">
            <h3 className="gb-section-title">✅ Named <span className="gb-count">{gameState.usedPlayers.length}</span></h3>
            <div className="gb-tags">
              {gameState.usedPlayers.slice(-15).map((p, i) => (
                <span className="gb-tag" key={i}>{p}</span>
              ))}
              {gameState.usedPlayers.length > 15 && (
                <span className="gb-tag gb-tag--more">+{gameState.usedPlayers.length - 15} more</span>
              )}
            </div>
          </section>
        )}

      </div>
      <style jsx>{GB_STYLES}</style>
    </div>
  );
};

export default GameBoard;