// Variables storage
let player;
let beforePlayer;
let afterPlayer;
let teethToneEffect;
let swiper;
let slides;
let imageCapture;

// Init all elements and inputs
const buttonsLeft = document.querySelector(".buttons--left");
const buttonsRight = document.querySelector(".buttons--right");
const closeButton = document.querySelector(".close");
const compareButton = document.querySelector(".compare");
const comparisonSlider = document.querySelector(".comparison-slider-container");
const container = document.querySelector(".container");
const fileInput = document.querySelector(".file");
const playerElement = document.querySelector(".player");
const replay = document.querySelector(".replay");
const saveButton = document.querySelector(".save");
const slider = document.querySelector(".swiper");
const takeAPicture = document.querySelector(".take-a-picture");

// Internal params for teeth tone effect
// You can change these parameters to achieve a better result
const darkTransparency = 0.2;
const nonLinear = 0.7;

// File storage
let fileSource = null;

// Compare flag
let isComparing = false;

// Teeth tone color ID
let colorId = "none";

/**
 * Applies teeth tone effect to the player and changes the teeth tone to the selected ID.
 * If the ID is "none", it clears the effect.
 * @param {String} id - The teeth tone ID to apply.
 * @returns {Promise<Boolean>}
 */
async function changeTeethTone(id) {
  console.log("Change teeth tone to: ", id);

  // Save teeth tone ID
  colorId = id;

  // Preload effect
  if (!teethToneEffect) {
    teethToneEffect = await BanubaSDK.Effect.preload("./teeth_tone.zip");
  }

  if (id == "none") {
    // Clear effect if ID is "none"
    player.clearEffect();
    afterPlayer?.clearEffect();
  } else {
    // Apply effect to player first
    await player.applyEffect(teethToneEffect);
    await afterPlayer?.applyEffect(teethToneEffect);

    // Change teeth tone on click
    await teethToneEffect.evalJs(
      `applyTeethTone("${id}", ${darkTransparency}, ${nonLinear})`
    );
  }

  return true;
}

/**
 * Initializes swiper carousel and adds event listeners to every slide.
 * When a slide is clicked, it applies the teeth tone effect to the player
 * and changes the teeth tone to the selected ID, or clears the effect if
 * ID is "none".
 */
function initSlides() {
  console.log("Init slider");

  // Init swiper carousel
  swiper = new Swiper(".swiper", {
    centeredSlides: true,
    slidesPerView: "auto",
    slideToClickedSlide: true,
  });

  slides = document.querySelectorAll(".swiper-slide");

  for (const slide of slides) {
    // Add event listeners for every slide
    slide.addEventListener("click", async function (event) {
      // Get teeth tone ID
      const id = event.target.getAttribute("data-id");

      await changeTeethTone(id);

      // Remove active class from all items
      slides.forEach(function (item) {
        item.classList.remove("active");
      });

      // Add active class to selected slide
      event.target.classList.add("active");
    });
  }

  return true;
}

/**
 * Creates a Banuba SDK player and renders it in the given element.
 * It also preloads and adds the face_tracker, eyes, and lips modules.
 * @param {HTMLElement} element - The element where the player will be rendered.
 * @returns {Promise<BanubaSDK.Player>} - The created player.
 */
async function createPlayer(element) {
  console.log("Create player call in: ", element);

  const isSafari = is.safari();

  // Fixes video range requests in Safari that cause AR effects animation delay
  // https://docs.banuba.com/far-sdk/tutorials/development/known_issues/web/#effect-animations-are-delayed-in-safari
  if (isSafari) {
    navigator.serviceWorker.register("./range-requests.sw.js");
  }

  if (window.TOKEN == "YOUR_CLIENT_TOKEN") {
    console.error(
      "Change YOUR_CLIENT_TOKEN to your client token in `token.js` file"
    );
    return false;
  }

  const sdkPlayer = await BanubaSDK.Player.create({
    clientToken: window.TOKEN,

    // Set proxy for video requests in Safari
    proxyVideoRequestsTo: isSafari ? "___range-requests___/" : null,

    // Load SDK additional files from CDN
    locateFile: {
      "BanubaSDK.data":
        "https://cdn.jsdelivr.net/npm/@banuba/webar/dist/BanubaSDK.data",
      "BanubaSDK.wasm":
        "https://cdn.jsdelivr.net/npm/@banuba/webar/dist/BanubaSDK.wasm",
      "BanubaSDK.simd.wasm":
        "https://cdn.jsdelivr.net/npm/@banuba/webar/dist/BanubaSDK.simd.wasm",
    },

    // Set device pixel ratio to 1 to avoid blurry images and better performance
    devicePixelRatio: 1,
  });

  // Find more about available modules:
  // https://docs.banuba.com/face-ar-sdk-v1/generated/typedoc/classes/Module.html
  for (const moduleName of ["face_tracker", "eyes", "lips"]) {
    const module = await BanubaSDK.Module.preload(
      `https://cdn.jsdelivr.net/npm/@banuba/webar/dist/modules/${moduleName}.zip`
    );
    await sdkPlayer.addModule(module);
  }

  // Render player in DOM
  BanubaSDK.Dom.render(sdkPlayer, element);

  return sdkPlayer;
}

/**
 * Initializes the Banuba SDK and loads the given file into the player.
 * If the player is already initialized, it will be destroyed and recreated.
 * @param {File} file - The file to load into the player.
 * @returns {Promise<void>}
 */
async function initSDK(file = false) {
  console.log("Init player with file: ", file);

  player = await createPlayer(playerElement);

  const webcam = new BanubaSDK.Webcam();
  player.use(webcam);

  // Create image capture for taking photos
  imageCapture = new BanubaSDK.ImageCapture(player);

  return true;
}

/**
 * Closes the comparison slider, restores the main player view, and clears any
 * existing before and after players. It unmounts and destroys the players
 * used in the comparison, hides the comparison UI elements, and reveals the
 * main player element.
 * @returns {Boolean} - Returns true when the operation is complete.
 */
function closeCompare() {
  // Get slot elements for compare slider
  const beforeSlot = document.querySelector(".before-slot");
  const afterSlot = document.querySelector(".after-slot");

  playerElement.classList.remove("hidden");
  comparisonSlider.classList.add("hidden");
  buttonsLeft.classList.add("hidden");

  // Destroy before and after players in comparison slider
  BanubaSDK.Dom.unmount(beforeSlot);
  beforePlayer?.destroy();
  beforePlayer = null;

  BanubaSDK.Dom.unmount(afterSlot);
  afterPlayer?.destroy();
  afterPlayer = null;

  return true;
}

/**
 * Initializes all events for the page.
 * @returns {Promise<Boolean>}
 */
function initEvents() {
  console.log("Init events");

  fileInput.addEventListener("change", async function (event) {
    const file = event.target.files[0];

    console.log("File changed: ", file?.name);

    // Save file for comparison
    fileSource = file;

    // Load file in player
    const fileInputSource = new BanubaSDK.Image(file);
    player.use(fileInputSource);

    // Apply saved teeth tone effect
    await changeTeethTone(colorId);

    // Hide start screen and show player
    slider.classList.remove("hidden");
    container.classList.add("hidden");
    buttonsRight.classList.remove("hidden");

    return true;
  });

  replay.addEventListener("click", function () {
    console.log("Replay button clicked");

    fileInput.value = null;
    slider.classList.add("hidden");
    container.classList.remove("hidden");
    buttonsRight.classList.add("hidden");

    closeCompare();

    // Clear player effect
    player.clearEffect();

    // Load webcam in player
    const webcam = new BanubaSDK.Webcam();
    player.use(webcam);

    return true;
  });

  takeAPicture.addEventListener("click", async function () {
    if (!imageCapture) {
      return false;
    }

    console.log("Take-a-picture button clicked");

    // Create file from image capture
    const file = new File(
      [await imageCapture.takePhoto({ quality: 100, type: "image/jpeg" })],
      "photo.jpg",
      { type: "image/jpeg" }
    );

    // Save file for comparison
    fileSource = file;

    // Load file in player
    const fileInputSource = new BanubaSDK.Image(file);
    player.use(fileInputSource);

    // Apply teeth tone effect after file load
    await changeTeethTone(colorId);

    // Hide start screen and show player
    playerElement.classList.remove("hidden");
    slider.classList.remove("hidden");
    container.classList.add("hidden");
    buttonsRight.classList.remove("hidden");

    return true;
  });

  saveButton.addEventListener("click", async function () {
    if (!imageCapture) {
      return false;
    }

    console.log("Save photo button clicked");

    // Create file from image capture and download it
    const file = new File(
      [await imageCapture.takePhoto({ quality: 100, type: "image/jpeg" })],
      `photo-${Date.now()}.jpg`,
      { type: "image/jpeg" }
    );

    const link = document.createElement("a");
    link.download = file.name;
    link.href = URL.createObjectURL(file);
    link.click();

    return true;
  });

  compareButton.addEventListener("click", async function () {
    console.log("Compare button clicked");

    // Get slot elements for compare slider
    const beforeSlot = document.querySelector(".before-slot");
    const afterSlot = document.querySelector(".after-slot");

    // Create two players in slot elements
    beforePlayer = await createPlayer(beforeSlot);
    afterPlayer = await createPlayer(afterSlot);

    // Create image input source for both slot players
    const fileInputSource = new BanubaSDK.Image(fileSource);
    player.use(fileInputSource);

    // User image source in slot players
    beforePlayer.use(fileInputSource);
    afterPlayer.use(fileInputSource);

    // Call teeth tone change for
    await changeTeethTone(colorId);

    isComparing = true;

    // Hide main player and show comparison slider
    playerElement.classList.add("hidden");
    comparisonSlider.classList.remove("hidden");
    buttonsLeft.classList.remove("hidden");

    return true;
  });

  closeButton.addEventListener("click", function () {
    console.log("Close button clicked");
    closeCompare();
    return true;
  });

  return true;
}

// Load app after page load
window.addEventListener("load", function () {
  initSlides();
  initSDK();
  initEvents();
});
