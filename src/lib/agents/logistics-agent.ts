import type { AgentInput, LabLogistics } from "./agent-types"

interface ActivityEquipment {
  items: { item: string; quantity: number; status: "available" | "limited" | "needs_order" | "out_of_stock" }[]
  setup: string[]
  safety: string[]
  labMessage: string
}

const EQUIPMENT_MAP: Record<string, ActivityEquipment> = {
  kinematics: {
    items: [
      { item: "Ticker timer (pita detak)", quantity: 6, status: "available" },
      { item: "Pita kertas ticker timer (roll)", quantity: 12, status: "limited" },
      { item: "Troli dinamika", quantity: 6, status: "available" },
      { item: "Rel presisi (1,2 m)", quantity: 3, status: "available" },
      { item: "Stopwatch digital", quantity: 12, status: "available" },
      { item: "Meteran (3 m)", quantity: 6, status: "available" },
      { item: "Bola pingpong", quantity: 12, status: "available" },
      { item: "Karbon kertas ticker (pack)", quantity: 3, status: "needs_order" }
    ],
    setup: [
      "Mount the precision rail on the laboratory bench at a 0° incline for uniform linear motion experiments",
      "Position the ticker timer at the end of the rail, ensuring the paper tape is correctly threaded",
      "Mark the rail at 0 cm, 50 cm, and 100 cm intervals using a whiteboard marker",
      "Verify that the stopwatches are functional and their batteries are not depleted",
      "Prepare 6 trolleys — label them A1 through A6 and check that the wheels rotate smoothly",
      "Calibrate the ticker timer: set the frequency to 50 Hz (one dot every 0.02 seconds)"
    ],
    safety: [
      "Ensure all ticker timer wires are properly insulated to prevent electrical hazards",
      "Keep paper ticker tape away from any sources of ignition",
      "Ensure the area around the track is clear of obstacles to prevent the trolley from falling",
      "Students must not run or push trolleys at excessive speed",
      "Closed-toe footwear is mandatory during all practical sessions"
    ],
    labMessage: `For Kinematics practical sessions across Grades ${7}-${12}:

Please prepare 6 sets of ticker timers and dynamics trolleys. Check the stock of ticker tape — 8 rolls remaining from the most recent purchase. If insufficient, please order 3 packs of ticker timer carbon paper immediately.

Most importantly, calibrate the ticker timers before the practical session. Set them to 50 Hz and test-run them with an unloaded trolley.

Thank you!`
  },
  forces: {
    items: [
      { item: "Neraca digital (0,1 g accuracy)", quantity: 6, status: "available" },
      { item: "Set beban (10g - 500g)", quantity: 6, status: "limited" },
      { item: "Dinamometer (0-5 N)", quantity: 12, status: "available" },
      { item: "Single pulley", quantity: 6, status: "available" },
      { item: "Nylon rope (3 mm × 5 m)", quantity: 3, status: "available" },
      { item: "Wooden blocks (various masses)", quantity: 6, status: "available" },
      { item: "Sandpaper sheets", quantity: 6, status: "available" },
      { item: "Inclined plane (30°, 45°, 60°)", quantity: 3, status: "out_of_stock" }
    ],
    setup: [
      "Set up 6 practical workstations, each equipped with a digital balance and a dynamometer",
      "Group the weight sets by mass: 10 g, 20 g, 50 g, 100 g, 200 g, and 500 g",
      "Secure a pulley at the edge of each table using a clamp",
      "Prepare wooden blocks of varying masses with different surface textures (smooth versus sandpaper)",
      "For inclined planes — set the angles to 30°, 45°, and 60° for experiments on forces on inclined planes"
    ],
    safety: [
      "Ensure that weights are not dropped on the floor, as this may damage the tiles and pose a risk of foot injury",
      "Use dynamometers with care — do not exceed their 5 N capacity",
      "Do not wrap the nylon rope around hands or fingers",
      "Be cautious of sharp edges on the pulley wire"
    ],
    labMessage: `Greetings, Lab Assistant.

This week's practical session covers Forces for Grades ${7} through ${9}.

Please inspect the stock of inclined planes — the last 3 sets appear to be in unsuitable condition, with cracks in the wooden frames. If available, kindly prepare those that are still in good condition.

Additionally, please sort the weight sets — some 100 g masses may have been mixed with other sets. Re-weigh them and affix proper labels.

Thank you.`
  },
  energy: {
    items: [
      { item: "Bola tenis", quantity: 12, status: "available" },
      { item: "Bola basket", quantity: 6, status: "available" },
      { item: "Meteran roll 5m", quantity: 6, status: "available" },
      { item: "Stopwatch digital", quantity: 12, status: "available" },
      { item: "Mobil mainan (wind-up)", quantity: 6, status: "limited" },
      { item: "Pegas (konstanta berbeda)", quantity: 12, status: "available" },
      { item: "Termometer digital", quantity: 6, status: "available" },
      { item: "Kalorimeter sederhana (gelas styrofoam)", quantity: 6, status: "available" }
    ],
    setup: [
      "Prepare the free-fall area — mark heights of 1 m, 1.5 m, and 2 m on the wall",
      "Attach a vertical measuring tape to the wall using adhesive tape",
      "Set up kinetic energy stations with wind-up toy cars and a horizontal measuring tape",
      "Set up calorimeter stations: Styrofoam cups, thermometers, and warm water"
    ],
    safety: [
      "Ensure the free-fall area is clear of people",
      "Do not throw the balls — simply release them",
      "Warm water for the calorimeters must not exceed 50 °C — check the temperature before the practical session",
      "Clean up any water spills immediately to prevent slipping"
    ],
    labMessage: `Lab Assistant,

This week's practical session on Energy is for Grade ${10}. Prepare 6 sets for the free-fall experiment using tennis balls and basketballs.

Please check the wind-up toy cars — some may require battery replacement (or repair of the winding mechanism). If any are damaged, notify me by Tuesday so that alternatives can be arranged.

Also, ensure that the warm water does not exceed 50 °C — safety first.

Thank you.`
  },
  electricity: {
    items: [
      { item: "Baterai 1,5 V (D-cell)", quantity: 24, status: "available" },
      { item: "Bohlam 2,5 V (small)", quantity: 24, status: "available" },
      { item: "Fitting bohlam", quantity: 24, status: "available" },
      { item: "Kabel penghubung (banana plug)", quantity: 48, status: "limited" },
      { item: "Amperemeter DC", quantity: 12, status: "available" },
      { item: "Voltmeter DC", quantity: 12, status: "available" },
      { item: "Resistor (10Ω, 20Ω, 50Ω, 100Ω)", quantity: 24, status: "available" },
      { item: "Saklar SPST", quantity: 12, status: "available" },
      { item: "Multimeter digital", quantity: 6, status: "available" }
    ],
    setup: [
      "Set up 6 circuit-building stations, each equipped with a breadboard",
      "Test all bulbs; replace any that are blown before the practical session",
      "Group the resistors by their resistance values and label them accordingly",
      "Check each battery with a multimeter — voltage should be 1.5 V ± 0.1 V",
      "Prepare instruction sheets for series and parallel circuits"
    ],
    safety: [
      "Low voltage (1.5–6 V) is generally safe, but students should remain supervised at all times",
      "WARNING: Do not connect the battery terminals directly without a load (short circuit)",
      "Inspect cables for frayed or stripped insulation",
      "Bulbs may become hot — allow them to cool before touching",
      "Ensure hands are dry when handling electrical components"
    ],
    labMessage: `Dear Lab Assistant,

This week, Grade ${10} will be conducting practical work on Electricity — series and parallel circuits.

Please check the banana plug cables — some may require re-soldering. Replace any that are broken.

Most urgent: test all 2.5 V bulbs. From experience, several tend to blow during storage.

Please test each battery individually with a multimeter.

Thank you.`
  },
  waves: {
    items: [
      { item: "Slinky besar", quantity: 6, status: "available" },
      { item: "Ripple tank (tangki riak)", quantity: 3, status: "limited" },
      { item: "Vibrator motor for ripple tank", quantity: 3, status: "limited" },
      { item: "Sumber cahaya (overhead projector)", quantity: 3, status: "available" },
      { item: "Penggaris 30 cm", quantity: 12, status: "available" },
      { item: "Garpu tala (256 Hz, 512 Hz)", quantity: 6, status: "available" },
      { item: "Tali nilon 3m", quantity: 6, status: "available" }
    ],
    setup: [
      "Lay the slinky on the floor — stretch it to approximately 3 m for the longitudinal wave demonstration",
      "Fill the ripple tank with water to a depth of 1–2 cm — ensure the water level is even",
      "Set up the motor vibrator and adjust its frequency",
      "Position the light source above the ripple tank for shadow projection",
      "Prepare the tuning forks and a rubber mallet"
    ],
    safety: [
      "Exercise caution with water near the ripple tanks — keep it away from electrical equipment",
      "Do not stretch the slinky beyond its elastic limit, as it may break",
      "Do not strike the tuning forks with excessive force",
      "The floor may become slippery due to water — wipe up any spills immediately"
    ],
    labMessage: `Lab Assistant,

The Waves practical session is for Grade ${11} AS Level.

Please prepare 3 ripple tanks. Fill them with 1–2 cm of water. Check the motor vibrators — they may need new batteries.

If any slinkies are damaged, please report them. The remaining equipment is in good condition.

Ensure the practical area is free of electrical cables on the floor, as water will be in use.

Thank you.`
  }
}

export async function generateLogistics(input: AgentInput): Promise<LabLogistics> {
  const key = input.topic.toLowerCase()
  let equipment: ActivityEquipment | undefined

  for (const [k, v] of Object.entries(EQUIPMENT_MAP)) {
    if (key.includes(k)) { equipment = v; break }
  }

  if (!equipment) {
    equipment = {
      items: [
        { item: "Whiteboard", quantity: 1, status: "available" },
        { item: "Whiteboard markers (set)", quantity: 6, status: "available" },
        { item: "Laptop + projector", quantity: 1, status: "available" },
        { item: "Student stationery set", quantity: 30, status: "available" },
        { item: "A4 paper (ream)", quantity: 2, status: "available" }
      ],
      setup: [
        "Arrange the classroom into group formations (4–5 students per group)",
        "Ensure the projector is functioning and connected to the teacher's laptop",
        "Print worksheets for all students (30 copies)"
      ],
      safety: [
        "Standard classroom procedures apply"
      ],
      labMessage: `This week's practical session on ${input.topic} will be conducted as an in-class demonstration — no specialised laboratory preparation is required. Simply prepare the projector and stationery.`
    }
  }

  return {
    lab_required: true,
    equipment_list: equipment.items,
    setup_instructions: equipment.setup,
    safety_notes: equipment.safety,
    lab_technician_message: equipment.labMessage
  }
}
