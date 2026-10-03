/* Places recommended across food blogs and guides (researched 3 Oct 2026).
   "stars" = how many of the six guides for that category mention the place.
   The site adds any of these that aren't already in the shared list, once per phone. */
export const GUIDE_PLACES = [
  // ---------- Coffee ----------
  { id: "g-nomad", area: "coffee", type: "eat", stars: "6/6", cat: "coffee", name: "Nomad Coffee Bar", address: "Passatge Sert 12, El Born", lat: 41.3889218, lng: 2.1770391, pid: "ChIJF3295_qipBIRFR8_uS69o6w",
    hours: "Thu–Fri 8:30–19:00 · Sat–Sun closed", note: "Barcelona's best-known specialty roaster. Small bar near Santa Caterina market; expect a short queue." },
  { id: "g-threemarks", area: "coffee", type: "eat", stars: "4/6", cat: "coffee", name: "Three Marks Coffee", address: "Carrer d'Ausiàs Marc 151, Fort Pienc", lat: 41.397245, lng: 2.183157, pid: "ChIJAQBsx-GipBIR1eID90RsOnQ",
    hours: "Daily 8:00–19:00", note: "From the Nomad founders. Bright, roomy café, handy on the way to Sagrada Família." },
  { id: "g-slowmov", area: "coffee", type: "eat", stars: "3/6", cat: "coffee", name: "SlowMov", address: "Carrer de Neptú 36, Gràcia", lat: 41.3984722, lng: 2.1539725, pid: "ChIJm3ct1pmipBIRgWL60eA3iio",
    hours: "Thu–Fri 8:00–17:00 · Sat–Sun closed", note: "Small roaster café with no laptops allowed. Great pastries and sandwiches." },
  { id: "g-hidden", area: "coffee", type: "eat", stars: "3/6", cat: "coffee", name: "Hidden Coffee Roasters", address: "Carrer dels Canvis Vells 10, El Born", lat: 41.3827882, lng: 2.1824279, pid: "ChIJ_Rd6gU2jpBIRppS0tbTAe28",
    hours: "Thu–Fri 8:00–19:00 · Sat–Sun 9:00–19:00", note: "Specialty roaster near Santa Maria del Mar. Order at the counter, then wait to be seated." },
  { id: "g-origo", area: "coffee", type: "eat", stars: "2/6", cat: "coffee", name: "Origo Bakery", address: "Carrer de Milà i Fontanals 9, Gràcia", lat: 41.4004951, lng: 2.1631969, pid: "ChIJU16BZpWipBIRcE4bBTVCAcE",
    hours: "Thu–Fri 8:00–20:30 · Sat–Sun 8:00–19:00", note: "Bakery with good coffee, a few minutes from our stay. The crema catalana pastry gets rave reviews." },
  { id: "g-dorigen", area: "coffee", type: "eat", stars: "2/6", cat: "coffee", name: "D'Origen Coffee Roasters", address: "Carrer de Casp 48, Eixample", lat: 41.3909501, lng: 2.1730171, pid: "ChIJh8WGFmOjpBIRJJSxIgnLghw",
    hours: "Thu–Sat 8:30–20:00 · Sun closed", note: "Roaster café near Plaça Catalunya with very good croissants." },

  // ---------- Tapas ----------
  { id: "g-calpep", area: "tapas", type: "eat", stars: "6/6", cat: "tapas", name: "Cal Pep", address: "Plaça de les Olles 8, El Born", lat: 41.3839621, lng: 2.1834106, pid: "ChIJbd9pOf6ipBIRt8JasLJbTHI",
    hours: "Thu–Fri 13:00–15:45, 19:30–23:30 · Sat 13:15–15:45, 19:30–23:30 · Sun closed", note: "Legendary counter bar with no menu: tell them what you like. Expect a queue, so arrive just before opening." },
  { id: "g-quimet", area: "tapas", type: "eat", stars: "6/6", cat: "tapas", name: "Quimet & Quimet", address: "Carrer del Poeta Cabanyes 25, Poble Sec", lat: 41.3739472, lng: 2.1655579, pid: "ChIJbSqmkF2ipBIROKuS4vazQO0",
    hours: "Thu–Fri 12:00–16:00, 18:00–22:30 · Sat–Sun closed", note: "Tiny, standing-only bar famous for its montaditos. Only open Thursday and Friday while we're there; go early." },
  { id: "g-covafumada", area: "tapas", type: "eat", stars: "6/6", cat: "tapas", name: "La Cova Fumada", address: "Carrer del Baluard 56, Barceloneta", lat: 41.3793025, lng: 2.1892183, pid: "ChIJvdFY9amjpBIRVecxFX2krK0",
    hours: "Thu–Fri 9:00–15:00 · Sat 9:00–14:00 · Sun closed", note: "Birthplace of the bomba. Lunch only and no sign outside: give your name and wait with a drink next door." },
  { id: "g-canete", area: "tapas", type: "eat", stars: "6/6", cat: "tapas", book: true, name: "Bar Cañete", address: "Carrer de la Unió 17, Raval", lat: 41.3791528, lng: 2.173125, pid: "ChIJGcsrQViipBIRY_vN9Piydxw",
    hours: "Thu–Sat 13:00–00:00 · Sun closed", note: "Lively open-kitchen bar just off La Rambla. Book ahead; the squid sandwich is the cult order." },
  { id: "g-xampanyet", area: "tapas", type: "eat", stars: "5/6", cat: "tapas", name: "El Xampanyet", address: "Carrer de Montcada 22, El Born", lat: 41.3845391, lng: 2.181679, pid: "ChIJR9uyi_6ipBIRuK0SZscDB3w",
    hours: "Thu–Fri 12:00–15:30, 19:00–23:00 · Sat 12:00–15:30 · Sun closed", note: "House cava and anchovies, a few doors from the Picasso Museum. Standing at the bar is half the fun." },
  { id: "g-laplata", area: "tapas", type: "eat", stars: "5/6", cat: "tapas", name: "La Plata", address: "Carrer de la Mercè 28, Gothic Quarter", lat: 41.38041, lng: 2.1805931, pid: "ChIJk4PX9FWipBIR4BejEaOwXzw",
    hours: "Thu–Sat 11:00–15:00, 18:00–23:00 · Sun closed", note: "Only a handful of classic dishes: fried fish, anchovies, tomato salad and house wine. Cheap and very old-school." },
  { id: "g-montbar", area: "tapas", type: "eat", stars: "5/6", cat: "tapas", book: true, name: "Mont Bar", address: "Carrer de la Diputació 220, Eixample", lat: 41.38622, lng: 2.161686, pid: "ChIJ0dN7e4yipBIRegh8fqP2o98",
    hours: "Thu–Sat 13:15–14:00, 18:45–21:45 · Sun closed", note: "Now a Michelin-starred tasting menu, so a splurge rather than casual tapas. Book well ahead." },
  { id: "g-canyi", area: "tapas", type: "eat", stars: "4/6", cat: "tapas", name: "Bar Canyí", address: "Carrer de Sepúlveda 107, Sant Antoni", lat: 41.3802899, lng: 2.1584069, pid: "ChIJM-hdop-jpBIRJjwt_Qjrblc",
    hours: "Thu–Sat 12:00–23:00 · Sun closed", note: "Neighbourhood bar near Sant Antoni market. Let the chef choose for you." },
  { id: "g-barpla", area: "tapas", type: "eat", stars: "4/6", cat: "tapas", name: "Bar del Pla", address: "Carrer de Montcada 2, El Born", lat: 41.385603, lng: 2.1800144, pid: "ChIJlxLxp_6ipBIRNCx_SbYvUPs",
    hours: "Thu–Sat 12:00–23:00 · Sun closed", note: "Creative seasonal tapas in a cosy, rambling El Born bar. They'll do half portions." },
  { id: "g-tangana", area: "tapas", type: "eat", stars: "4/6", cat: "tapas", name: "Tangana", address: "Riera de Sant Miquel 19, Gràcia", lat: 41.3975281, lng: 2.1569839, pid: "ChIJ4cQCPeajpBIRy7NkIbJ0oWY",
    hours: "Thu–Sat 13:00–00:00 · Sun closed", note: "Trendy Gràcia spot for sharing plates and very fresh seafood. About 10 minutes from our stay." },
  { id: "g-pacomeralgo", area: "tapas", type: "eat", stars: "4/6", cat: "tapas", book: true, name: "Paco Meralgo", address: "Carrer de Muntaner 171, Eixample", lat: 41.3916259, lng: 2.1524973, pid: "ChIJzeQs2JqipBIREQ4pkufEXzM",
    hours: "Daily 13:00–00:00", note: "Michelin-listed tapas bar. Book seats at the bar to watch the kitchen." },
  { id: "g-catalana", area: "tapas", type: "eat", stars: "3/6", cat: "tapas", name: "Cervecería Catalana", address: "Carrer de Mallorca 236, Eixample", lat: 41.3923251, lng: 2.1608515, pid: "ChIJ14DbPpKipBIROjfbj6-0FW0",
    hours: "Daily 8:30–01:00", note: "Big, buzzing and good value. No bookings: put your name down and wander nearby while you wait." },
  { id: "g-solera", area: "tapas", type: "eat", stars: "3/6", cat: "tapas", name: "Bodega Solera", address: "Carrer de Còrsega 339, Gràcia", lat: 41.3978403, lng: 2.1608791, pid: "ChIJu5cxV1mjpBIRvEYrIO8Sr74",
    hours: "Thu 18:00–00:00 · Fri–Sat 13:00–01:00 · Sun 13:00–00:00", note: "Wine bar from the Bar Mut team, a couple of minutes from our stay. Small menu, big wine list." },
  { id: "g-quimboqueria", area: "tapas", type: "eat", stars: "3/6", cat: "tapas", name: "El Quim de la Boqueria", address: "Inside La Boqueria market", lat: 41.3816124, lng: 2.1719094, pid: "ChIJuUIe1_mipBIRvxFsLzykv9U",
    hours: "Thu 9:00–16:00 · Fri–Sat 9:00–16:30 · Sun closed", note: "Counter bar inside the market. Fried eggs with baby squid is the signature dish." },
  { id: "g-vasodeoro", area: "tapas", type: "eat", stars: "3/6", cat: "tapas", name: "El Vaso de Oro", address: "Carrer de Balboa 6, Barceloneta", lat: 41.3818495, lng: 2.1873163, pid: "ChIJeW2d8wCjpBIRVzGltt5DgTc",
    hours: "Daily 12:00–00:00", note: "Narrow, packed beer bar. Order the steak with foie gras and onions." },
  { id: "g-bodegaquimet", area: "tapas", type: "eat", stars: "3/6", cat: "tapas", name: "Bodega Quimet", address: "Carrer de Vic 23, Gràcia", lat: 41.3991466, lng: 2.1547168, pid: "ChIJ9fNbKJiipBIR9E8Evc0a1OY",
    hours: "Thu–Sat 10:00–16:00, 18:00–23:00 · Sun 11:00–16:00", note: "Old-school vermouth bodega lined with barrels. Good for a vermut before lunch." },
  { id: "g-jaica", area: "tapas", type: "eat", stars: "3/6", cat: "tapas", name: "Jai-Ca", address: "Carrer de Ginebra 13, Barceloneta", lat: 41.3816584, lng: 2.1881988, pid: "ChIJNY4SvwCjpBIRixgP2NZo70E",
    hours: "Daily 8:00–23:00 (from 9:00 at weekends)", note: "Cheap and cheerful Barceloneta tapas. The chipirones (baby squid) are the star." },
  { id: "g-pepita", area: "tapas", type: "eat", stars: "2/6", cat: "tapas", book: true, name: "La Pepita", address: "Carrer de Còrsega 343, Gràcia", lat: 41.3979631, lng: 2.1610472, pid: "ChIJl7hQSJSipBIRk7b0Z4WCgwE",
    hours: "Daily from 13:00 until late", note: "Right by our stay, with walls covered in handwritten notes. Book, as it gets packed." },
  { id: "g-tapas24", area: "tapas", type: "eat", stars: "2/6", cat: "tapas", name: "Tapas 24", address: "Carrer de la Diputació 269, Eixample", lat: 41.3909531, lng: 2.1675608, pid: "ChIJPfRDh-2ipBIRZv1N4WCZtR0",
    hours: "Daily 12:00–00:00", note: "Carles Abellán's tapas bar just off Passeig de Gràcia. Order the 'Bikini' toastie." },

  // ---------- Markets ----------
  { id: "g-santantoni", area: "markets", type: "see", stars: "6/6", cat: "market", name: "Mercat de Sant Antoni", address: "Carrer del Comte d'Urgell 1, Sant Antoni", lat: 41.3786358, lng: 2.1620492, pid: "ChIJVU1DOWCipBIRSA8HlZk90Zk",
    hours: "Thu–Sat 8:00–20:30 · Sun closed (second-hand book market outside on Sunday mornings)", note: "Huge restored iron market where locals shop. Fresh food, ham and cheese stalls." },
  { id: "g-concepcio", area: "markets", type: "see", stars: "4/6", cat: "market", name: "Mercat de la Concepció", address: "Carrer d'Aragó 311 bis, Eixample", lat: 41.3959078, lng: 2.1686521, pid: "ChIJNcNCBOyipBIRN_x0kHfTC5E",
    hours: "Thu–Fri 8:00–20:00 · Sat 8:00–15:00 · Sun closed", note: "Locals' market about 10 minutes from our stay, known for its flower stalls." },
  { id: "g-ninot", area: "markets", type: "see", stars: "4/6", cat: "market", name: "Mercat del Ninot", address: "Carrer de Mallorca 133, Eixample", lat: 41.3878514, lng: 2.1543196, pid: "ChIJH8JkmoWipBIRBLR_rpCvNjw",
    hours: "Thu–Sat 8:00–20:00 · Sun closed", note: "Modern locals' market with good lunch counters. At some stalls you pick your meat and they grill it for you." },
  { id: "g-llibertat", area: "markets", type: "see", stars: "3/6", cat: "market", name: "Mercat de la Llibertat", address: "Plaça de la Llibertat 27, Gràcia", lat: 41.3998361, lng: 2.1535784, pid: "ChIJHUSgFZiipBIRcZHltQEFyuw",
    hours: "Thu–Fri 8:00–20:30 · Sat 8:00–15:00 · Sun closed", note: "Pretty 1888 iron market in Gràcia, calm and local. About 15 minutes from our stay." },
  { id: "g-barcelonetamkt", area: "markets", type: "see", stars: "2/6", cat: "market", name: "Mercat de la Barceloneta", address: "Plaça del Poeta Boscà 1, Barceloneta", lat: 41.3803674, lng: 2.1892217, pid: "ChIJAaUaAKqjpBIRXRe69JoXgUg",
    hours: "Thu–Sat 7:30–14:00 · Sun closed", note: "Small neighbourhood market. Pair it with La Cova Fumada round the corner." },
  { id: "g-terra", area: "markets", type: "see", stars: "2/6", cat: "market", name: "Mercat de la Terra (Slow Food)", address: "Avinguda del Paral·lel 49, Poble Sec", lat: 41.3746162, lng: 2.17205, pid: "ChIJ6wCLyluipBIRp2vYjWIxxGk",
    hours: "Saturday 9:00–13:30 only", note: "Outdoor farmers' market with cheese, bread, wine and vermouth. Saturday morning only, so it fits our Saturday." }
];

/* Guide mentions for places already on our list. */
export const GUIDE_STARS = {
  caterina: "6/6", boqueria: "5/6", timeout: "2/6", mut: "2/6",
  ...Object.fromEntries(GUIDE_PLACES.map(p => [p.id, p.stars]))
};
