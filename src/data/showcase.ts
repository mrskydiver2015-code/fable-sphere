import type { LibraryEntry } from "../core/types";
import { keyFor } from "../core/storage";
// Original SVG illustrations in public/showcase; regenerate with scripts/generate-showcase.py.
const covers = [
  {
    name: "Pac-Man Reimagined",
    file: "pac-man-reimagined.svg",
    category: "Games/Interactive",
    color: "#59e5ff",
    summary:
      "A luminous maze study with pixel characters, collectible trails and a playful arcade rhythm.",
  },
  {
    name: "Retro Arcade Lab",
    file: "retro-arcade-lab.svg",
    category: "Games/Interactive",
    color: "#ff659d",
    summary:
      "A cabinet collection exploring retro controls, screen composition and vibrant arcade identities.",
  },
  {
    name: "WebGL Shader Explorer",
    file: "webgl-shader-explorer.svg",
    category: "Generative Graphics",
    color: "#b5f36c",
    summary:
      "A real-time graphics study of wave interference, surface colour and mathematical light.",
  },
  {
    name: "3D Gaussian Splatting",
    file: "3d-gaussian-splatting.svg",
    category: "Generative Graphics",
    color: "#ae95ff",
    summary:
      "A sculptural point-cloud study that reveals volume through thousands of coloured samples.",
  },
  {
    name: "Neural Synthesis",
    file: "neural-synthesis.svg",
    category: "System Architecture",
    color: "#ffba60",
    summary:
      "A layered network diagram exploring connections, signal flow and learning systems.",
  },
  {
    name: "Spatial UI Experiments",
    file: "spatial-ui-experiments.svg",
    category: "WebGL/Canvas",
    color: "#59e5ff",
    summary:
      "A creative workspace concept combining visual canvases, layered tools and modular panels.",
  },
  {
    name: "Industrial Automation Model",
    file: "industrial-automation-model.svg",
    category: "System Architecture",
    color: "#ff659d",
    summary:
      "An industrial cell study featuring articulated robots, workstations and coordinated motion.",
  },
  {
    name: "Vector Architecture",
    file: "vector-architecture.svg",
    category: "System Architecture",
    color: "#b5f36c",
    summary:
      "An architectural study of modular volumes, structural rhythm and isometric space.",
  },
  {
    name: "Moonbase Runner",
    file: "moonbase-runner.svg",
    category: "Games/Interactive",
    color: "#ae95ff",
    summary:
      "A spaceflight concept exploring planetary forms, navigation and orbital travel.",
  },
  {
    name: "Voxel Garden",
    file: "voxel-garden.svg",
    category: "WebGL/Canvas",
    color: "#ffba60",
    summary:
      "A three-dimensional world study built from colourful blocks and isometric terrain.",
  },
  {
    name: "Orbit Racing",
    file: "orbit-racing.svg",
    category: "Games/Interactive",
    color: "#59e5ff",
    summary:
      "A neon racing concept with geometric roads, luminous vehicles and a synthwave horizon.",
  },
  {
    name: "Pixel Platformer",
    file: "pixel-platformer.svg",
    category: "Games/Interactive",
    color: "#ff659d",
    summary:
      "A pixel-world composition of floating platforms, collectibles and playful movement.",
  },
  {
    name: "Creative Apps Studio",
    file: "creative-apps-studio.svg",
    category: "WebGL/Canvas",
    color: "#b5f36c",
    summary:
      "A creative workspace concept combining visual canvases, layered tools and modular panels.",
  },
  {
    name: "Procedural City",
    file: "procedural-city.svg",
    category: "System Architecture",
    color: "#ae95ff",
    summary:
      "An architectural study of modular volumes, structural rhythm and isometric space.",
  },
  {
    name: "Audio Spectrum Lab",
    file: "audio-spectrum-lab.svg",
    category: "Audio/Synth",
    color: "#ffba60",
    summary:
      "A sound-design study translating frequency, amplitude and rhythm into a visual score.",
  },
  {
    name: "Generative Type Foundry",
    file: "generative-type-foundry.svg",
    category: "Document Studies",
    color: "#59e5ff",
    summary:
      "A typography specimen examining letterform scale, colour and editorial hierarchy.",
  },
  {
    name: "Electric Maze",
    file: "electric-maze.svg",
    category: "Games/Interactive",
    color: "#ff659d",
    summary:
      "A luminous maze study with pixel characters, collectible trails and a playful arcade rhythm.",
  },
  {
    name: "Cosmic Pinball",
    file: "cosmic-pinball.svg",
    category: "Games/Interactive",
    color: "#b5f36c",
    summary:
      "An arcade table study of bumpers, rails, flippers and energetic ball paths.",
  },
  {
    name: "3D Canvas Playground",
    file: "3d-canvas-playground.svg",
    category: "WebGL/Canvas",
    color: "#ae95ff",
    summary:
      "A three-dimensional world study built from colourful blocks and isometric terrain.",
  },
  {
    name: "Point Cloud Observatory",
    file: "point-cloud-observatory.svg",
    category: "Generative Graphics",
    color: "#ffba60",
    summary:
      "A sculptural point-cloud study that reveals volume through thousands of coloured samples.",
  },
  {
    name: "Synthwave Sequencer",
    file: "synthwave-sequencer.svg",
    category: "Audio/Synth",
    color: "#59e5ff",
    summary:
      "A sound-design study translating frequency, amplitude and rhythm into a visual score.",
  },
  {
    name: "Machine Vision Studio",
    file: "machine-vision-studio.svg",
    category: "System Architecture",
    color: "#ff659d",
    summary:
      "An industrial cell study featuring articulated robots, workstations and coordinated motion.",
  },
  {
    name: "Interactive Data Atlas",
    file: "interactive-data-atlas.svg",
    category: "System Architecture",
    color: "#b5f36c",
    summary:
      "An analytical workspace balancing charts, readable measures and compact dashboards.",
  },
  {
    name: "Shader Ocean",
    file: "shader-ocean.svg",
    category: "Generative Graphics",
    color: "#ae95ff",
    summary:
      "A real-time graphics study of wave interference, surface colour and mathematical light.",
  },
  {
    name: "Night Drive Arcade",
    file: "night-drive-arcade.svg",
    category: "Games/Interactive",
    color: "#ffba60",
    summary:
      "A neon racing concept with geometric roads, luminous vehicles and a synthwave horizon.",
  },
  {
    name: "Orbital Station",
    file: "orbital-station.svg",
    category: "Games/Interactive",
    color: "#59e5ff",
    summary:
      "A spaceflight concept exploring planetary forms, navigation and orbital travel.",
  },
  {
    name: "Tiny Planet Builder",
    file: "tiny-planet-builder.svg",
    category: "WebGL/Canvas",
    color: "#ff659d",
    summary:
      "A three-dimensional world study built from colourful blocks and isometric terrain.",
  },
  {
    name: "Pixel Quest",
    file: "pixel-quest.svg",
    category: "Games/Interactive",
    color: "#b5f36c",
    summary:
      "A pixel-world composition of floating platforms, collectibles and playful movement.",
  },
  {
    name: "Neural Network Atlas",
    file: "neural-network-atlas.svg",
    category: "System Architecture",
    color: "#ae95ff",
    summary:
      "A layered network diagram exploring connections, signal flow and learning systems.",
  },
  {
    name: "Motion Design Canvas",
    file: "motion-design-canvas.svg",
    category: "WebGL/Canvas",
    color: "#ffba60",
    summary:
      "A creative workspace concept combining visual canvases, layered tools and modular panels.",
  },
  {
    name: "Parametric Pavilion",
    file: "parametric-pavilion.svg",
    category: "System Architecture",
    color: "#59e5ff",
    summary:
      "An architectural study of modular volumes, structural rhythm and isometric space.",
  },
  {
    name: "Chromatic Letterpress",
    file: "chromatic-letterpress.svg",
    category: "Document Studies",
    color: "#ff659d",
    summary:
      "A typography specimen examining letterform scale, colour and editorial hierarchy.",
  },
  {
    name: "Arcade Cabinet Collection",
    file: "arcade-cabinet-collection.svg",
    category: "Games/Interactive",
    color: "#b5f36c",
    summary:
      "A cabinet collection exploring retro controls, screen composition and vibrant arcade identities.",
  },
  {
    name: "Lunar Pinball",
    file: "lunar-pinball.svg",
    category: "Games/Interactive",
    color: "#ae95ff",
    summary:
      "An arcade table study of bumpers, rails, flippers and energetic ball paths.",
  },
  {
    name: "Particle Sculpture",
    file: "particle-sculpture.svg",
    category: "Generative Graphics",
    color: "#ffba60",
    summary:
      "A sculptural point-cloud study that reveals volume through thousands of coloured samples.",
  },
  {
    name: "Robotic Assembly Line",
    file: "robotic-assembly-line.svg",
    category: "System Architecture",
    color: "#59e5ff",
    summary:
      "An industrial cell study featuring articulated robots, workstations and coordinated motion.",
  },
  {
    name: "Soundscape Composer",
    file: "soundscape-composer.svg",
    category: "Audio/Synth",
    color: "#ff659d",
    summary:
      "A sound-design study translating frequency, amplitude and rhythm into a visual score.",
  },
  {
    name: "Open Data Explorer",
    file: "open-data-explorer.svg",
    category: "System Architecture",
    color: "#b5f36c",
    summary:
      "An analytical workspace balancing charts, readable measures and compact dashboards.",
  },
  {
    name: "Creative Coding Workspace",
    file: "creative-coding-workspace.svg",
    category: "WebGL/Canvas",
    color: "#ae95ff",
    summary:
      "A creative workspace concept combining visual canvases, layered tools and modular panels.",
  },
  {
    name: "Deep Space Navigation",
    file: "deep-space-navigation.svg",
    category: "Games/Interactive",
    color: "#ffba60",
    summary:
      "A spaceflight concept exploring planetary forms, navigation and orbital travel.",
  },
  {
    name: "Prism Breaker",
    file: "prism-breaker.svg",
    category: "Games/Interactive",
    color: "#59e5ff",
    summary:
      "A cabinet collection exploring retro controls, screen composition and vibrant arcade identities.",
  },
  {
    name: "Labyrinth Courier",
    file: "labyrinth-courier.svg",
    category: "Games/Interactive",
    color: "#ff659d",
    summary:
      "A luminous maze study with pixel characters, collectible trails and a playful arcade rhythm.",
  },
  {
    name: "Solar Circuit",
    file: "solar-circuit.svg",
    category: "Games/Interactive",
    color: "#b5f36c",
    summary:
      "A neon racing concept with geometric roads, luminous vehicles and a synthwave horizon.",
  },
  {
    name: "Flow Field Botanica",
    file: "flow-field-botanica.svg",
    category: "Generative Graphics",
    color: "#ae95ff",
    summary:
      "A generative drawing study of curved trajectories, organic growth and layered linework.",
  },
  {
    name: "Reaction Diffusion Atlas",
    file: "reaction-diffusion-atlas.svg",
    category: "Generative Graphics",
    color: "#ffba60",
    summary:
      "A real-time graphics study of wave interference, surface colour and mathematical light.",
  },
  {
    name: "Lissajous Light Garden",
    file: "lissajous-light-garden.svg",
    category: "Generative Graphics",
    color: "#59e5ff",
    summary:
      "A generative drawing study of curved trajectories, organic growth and layered linework.",
  },
  {
    name: "Kinetic Topography",
    file: "kinetic-topography.svg",
    category: "Generative Graphics",
    color: "#ff659d",
    summary:
      "A sculptural point-cloud study that reveals volume through thousands of coloured samples.",
  },
  {
    name: "Chromatic Interference",
    file: "chromatic-interference.svg",
    category: "Generative Graphics",
    color: "#b5f36c",
    summary:
      "A real-time graphics study of wave interference, surface colour and mathematical light.",
  },
  {
    name: "Recursive Fern Studio",
    file: "recursive-fern-studio.svg",
    category: "Generative Graphics",
    color: "#ae95ff",
    summary:
      "A generative drawing study of curved trajectories, organic growth and layered linework.",
  },
  {
    name: "Harmonic Ribbon Loom",
    file: "harmonic-ribbon-loom.svg",
    category: "Generative Graphics",
    color: "#ffba60",
    summary:
      "A generative drawing study of curved trajectories, organic growth and layered linework.",
  },
  {
    name: "Voronoi Weather",
    file: "voronoi-weather.svg",
    category: "Generative Graphics",
    color: "#59e5ff",
    summary:
      "A sculptural point-cloud study that reveals volume through thousands of coloured samples.",
  },
  {
    name: "Fractal Coastlines",
    file: "fractal-coastlines.svg",
    category: "Generative Graphics",
    color: "#ff659d",
    summary:
      "A real-time graphics study of wave interference, surface colour and mathematical light.",
  },
  {
    name: "Particle Calligraphy",
    file: "particle-calligraphy.svg",
    category: "Generative Graphics",
    color: "#b5f36c",
    summary:
      "A generative drawing study of curved trajectories, organic growth and layered linework.",
  },
  {
    name: "Moir\u00e9 Observatory",
    file: "moir\u00e9-observatory.svg",
    category: "Generative Graphics",
    color: "#ae95ff",
    summary:
      "A real-time graphics study of wave interference, surface colour and mathematical light.",
  },
  {
    name: "Canvas Compositor",
    file: "canvas-compositor.svg",
    category: "WebGL/Canvas",
    color: "#ffba60",
    summary:
      "A creative workspace concept combining visual canvases, layered tools and modular panels.",
  },
  {
    name: "Instanced Forest",
    file: "instanced-forest.svg",
    category: "WebGL/Canvas",
    color: "#59e5ff",
    summary:
      "A three-dimensional world study built from colourful blocks and isometric terrain.",
  },
  {
    name: "Raymarching Workshop",
    file: "raymarching-workshop.svg",
    category: "WebGL/Canvas",
    color: "#ff659d",
    summary:
      "A real-time graphics study of wave interference, surface colour and mathematical light.",
  },
  {
    name: "Fluid Dynamics Canvas",
    file: "fluid-dynamics-canvas.svg",
    category: "WebGL/Canvas",
    color: "#b5f36c",
    summary:
      "A generative drawing study of curved trajectories, organic growth and layered linework.",
  },
  {
    name: "Signed Distance Studio",
    file: "signed-distance-studio.svg",
    category: "WebGL/Canvas",
    color: "#ae95ff",
    summary:
      "A sculptural point-cloud study that reveals volume through thousands of coloured samples.",
  },
  {
    name: "Terrain Sculptor",
    file: "terrain-sculptor.svg",
    category: "WebGL/Canvas",
    color: "#ffba60",
    summary:
      "A three-dimensional world study built from colourful blocks and isometric terrain.",
  },
  {
    name: "Interactive Lighting Rig",
    file: "interactive-lighting-rig.svg",
    category: "WebGL/Canvas",
    color: "#59e5ff",
    summary:
      "A creative workspace concept combining visual canvases, layered tools and modular panels.",
  },
  {
    name: "Volumetric Cloud Lab",
    file: "volumetric-cloud-lab.svg",
    category: "WebGL/Canvas",
    color: "#ff659d",
    summary:
      "A sculptural point-cloud study that reveals volume through thousands of coloured samples.",
  },
  {
    name: "Mesh Deformation Bench",
    file: "mesh-deformation-bench.svg",
    category: "WebGL/Canvas",
    color: "#b5f36c",
    summary:
      "A three-dimensional world study built from colourful blocks and isometric terrain.",
  },
  {
    name: "Event Stream Topology",
    file: "event-stream-topology.svg",
    category: "System Architecture",
    color: "#ae95ff",
    summary:
      "A system blueprint of connected services, message paths and resilient infrastructure.",
  },
  {
    name: "Distributed Cache Atlas",
    file: "distributed-cache-atlas.svg",
    category: "System Architecture",
    color: "#ffba60",
    summary:
      "A system blueprint of connected services, message paths and resilient infrastructure.",
  },
  {
    name: "Service Mesh Blueprint",
    file: "service-mesh-blueprint.svg",
    category: "System Architecture",
    color: "#59e5ff",
    summary:
      "A system blueprint of connected services, message paths and resilient infrastructure.",
  },
  {
    name: "Edge Computing Observatory",
    file: "edge-computing-observatory.svg",
    category: "System Architecture",
    color: "#ff659d",
    summary:
      "An analytical workspace balancing charts, readable measures and compact dashboards.",
  },
  {
    name: "Resilient Queue Design",
    file: "resilient-queue-design.svg",
    category: "System Architecture",
    color: "#b5f36c",
    summary:
      "A system blueprint of connected services, message paths and resilient infrastructure.",
  },
  {
    name: "Digital Twin Factory",
    file: "digital-twin-factory.svg",
    category: "System Architecture",
    color: "#ae95ff",
    summary:
      "An industrial cell study featuring articulated robots, workstations and coordinated motion.",
  },
  {
    name: "Modular Synth Rack",
    file: "modular-synth-rack.svg",
    category: "Audio/Synth",
    color: "#ffba60",
    summary:
      "A modular instrument concept with patch cables, sequencers and expressive sound controls.",
  },
  {
    name: "Granular Sound Garden",
    file: "granular-sound-garden.svg",
    category: "Audio/Synth",
    color: "#59e5ff",
    summary:
      "A sound-design study translating frequency, amplitude and rhythm into a visual score.",
  },
  {
    name: "FM Operator Playground",
    file: "fm-operator-playground.svg",
    category: "Audio/Synth",
    color: "#ff659d",
    summary:
      "A modular instrument concept with patch cables, sequencers and expressive sound controls.",
  },
  {
    name: "Polyrhythm Drum Machine",
    file: "polyrhythm-drum-machine.svg",
    category: "Audio/Synth",
    color: "#b5f36c",
    summary:
      "A modular instrument concept with patch cables, sequencers and expressive sound controls.",
  },
  {
    name: "Tape Echo Workshop",
    file: "tape-echo-workshop.svg",
    category: "Audio/Synth",
    color: "#ae95ff",
    summary:
      "A sound-design study translating frequency, amplitude and rhythm into a visual score.",
  },
  {
    name: "Wavetable Morph Studio",
    file: "wavetable-morph-studio.svg",
    category: "Audio/Synth",
    color: "#ffba60",
    summary:
      "A sound-design study translating frequency, amplitude and rhythm into a visual score.",
  },
  {
    name: "Harmonic Resonator",
    file: "harmonic-resonator.svg",
    category: "Audio/Synth",
    color: "#59e5ff",
    summary:
      "A modular instrument concept with patch cables, sequencers and expressive sound controls.",
  },
  {
    name: "Spectrogram Notebook",
    file: "spectrogram-notebook.svg",
    category: "Audio/Synth",
    color: "#ff659d",
    summary:
      "A sound-design study translating frequency, amplitude and rhythm into a visual score.",
  },
  {
    name: "Ambient Patch Bay",
    file: "ambient-patch-bay.svg",
    category: "Audio/Synth",
    color: "#b5f36c",
    summary:
      "A modular instrument concept with patch cables, sequencers and expressive sound controls.",
  },
  {
    name: "Physical Modelling Lab",
    file: "physical-modelling-lab.svg",
    category: "Audio/Synth",
    color: "#ae95ff",
    summary:
      "A sound-design study translating frequency, amplitude and rhythm into a visual score.",
  },
  {
    name: "Step Sequencer Grid",
    file: "step-sequencer-grid.svg",
    category: "Audio/Synth",
    color: "#ffba60",
    summary:
      "A modular instrument concept with patch cables, sequencers and expressive sound controls.",
  },
  {
    name: "Spatial Mixer Console",
    file: "spatial-mixer-console.svg",
    category: "Audio/Synth",
    color: "#59e5ff",
    summary:
      "A modular instrument concept with patch cables, sequencers and expressive sound controls.",
  },
  {
    name: "Frequency Shifter",
    file: "frequency-shifter.svg",
    category: "Audio/Synth",
    color: "#ff659d",
    summary:
      "A sound-design study translating frequency, amplitude and rhythm into a visual score.",
  },
  {
    name: "Editorial Grid Handbook",
    file: "editorial-grid-handbook.svg",
    category: "Document Studies",
    color: "#b5f36c",
    summary:
      "An editorial document study of page hierarchy, annotations and clear information design.",
  },
  {
    name: "Research Paper Anatomy",
    file: "research-paper-anatomy.svg",
    category: "Document Studies",
    color: "#ae95ff",
    summary:
      "An editorial document study of page hierarchy, annotations and clear information design.",
  },
  {
    name: "Technical Specification Folio",
    file: "technical-specification-folio.svg",
    category: "Document Studies",
    color: "#ffba60",
    summary:
      "An editorial document study of page hierarchy, annotations and clear information design.",
  },
  {
    name: "Annual Report System",
    file: "annual-report-system.svg",
    category: "Document Studies",
    color: "#59e5ff",
    summary:
      "A structured document study exploring tables, measured spacing and useful data summaries.",
  },
  {
    name: "Blueprint Field Notes",
    file: "blueprint-field-notes.svg",
    category: "Document Studies",
    color: "#ff659d",
    summary:
      "A technical notebook of dimensioned drawings, construction lines and engineering notes.",
  },
  {
    name: "Typography Specimen Book",
    file: "typography-specimen-book.svg",
    category: "Document Studies",
    color: "#b5f36c",
    summary:
      "A typography specimen examining letterform scale, colour and editorial hierarchy.",
  },
  {
    name: "Data Table Design Study",
    file: "data-table-design-study.svg",
    category: "Document Studies",
    color: "#ae95ff",
    summary:
      "A structured document study exploring tables, measured spacing and useful data summaries.",
  },
  {
    name: "Invoice Layout Workshop",
    file: "invoice-layout-workshop.svg",
    category: "Document Studies",
    color: "#ffba60",
    summary:
      "A structured document study exploring tables, measured spacing and useful data summaries.",
  },
  {
    name: "Design System Guidelines",
    file: "design-system-guidelines.svg",
    category: "Document Studies",
    color: "#59e5ff",
    summary:
      "An editorial document study of page hierarchy, annotations and clear information design.",
  },
  {
    name: "Architecture Decision Records",
    file: "architecture-decision-records.svg",
    category: "Document Studies",
    color: "#ff659d",
    summary:
      "A technical notebook of dimensioned drawings, construction lines and engineering notes.",
  },
  {
    name: "Scientific Poster Studio",
    file: "scientific-poster-studio.svg",
    category: "Document Studies",
    color: "#b5f36c",
    summary:
      "An editorial document study of page hierarchy, annotations and clear information design.",
  },
  {
    name: "Accessible Form Patterns",
    file: "accessible-form-patterns.svg",
    category: "Document Studies",
    color: "#ae95ff",
    summary:
      "A structured document study exploring tables, measured spacing and useful data summaries.",
  },
  {
    name: "Release Notes Journal",
    file: "release-notes-journal.svg",
    category: "Document Studies",
    color: "#ffba60",
    summary:
      "An editorial document study of page hierarchy, annotations and clear information design.",
  },
  {
    name: "Engineering Drawing Index",
    file: "engineering-drawing-index.svg",
    category: "Document Studies",
    color: "#59e5ff",
    summary:
      "A technical notebook of dimensioned drawings, construction lines and engineering notes.",
  },
];
export function makeShowcase(now = Date.now()): LibraryEntry[] {
  return covers.map((cover, index) => {
    const id = `showcase-${index}`;
    return {
      key: keyFor(id, "showcase"),
      id,
      space: "showcase",
      kind: "asset",
      parentId: null,
      name: cover.name,
      category: cover.category,
      headerColor: cover.color,
      desc: cover.summary,
      demoUrl:
        index === 0 || index === 16
          ? "https://pacman-reimagined.vercel.app"
          : undefined,
      type: "Image",
      mime: "image/svg+xml",
      demoArt: true,
      thumbnail: `/showcase/${cover.file}`,
      seed: index,
      art: "landscape",
      created: now - index * 86400000,
      updated: now - index * 86400000,
    };
  });
}
