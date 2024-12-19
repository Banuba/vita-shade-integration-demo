# VITA Shade Teeth Whitening Example

This example demonstrates how to create a simple VITA Shade teeth whitening effect using the Banuba SDK. It allows users to load an image, apply a whitening effect, and change the shade with a click. Additionally, it features a comparison slider to compare the original image with the modified version.

## Requirements

- A modern web browser with JavaScript enabled.
- Webcam access is required for live video functionality.
- An image file to apply the effect.

## How to Use

1. **Insert Your Token**: Before launching the example, ensure you have inserted your Banuba SDK token in `token.js`.
2. **Open the Example**: Launch `index.html` in your browser.
3. **Grant Permissions**: Allow access to your webcam when prompted.
4. **Load an Image**: Click the "Choose file" button to upload an image.
5. **Apply Whitening Effect**: Select a VITA Shade color to apply the whitening effect to the image.
6. **Use the Comparison Slider**: Click the "Compare" button to activate the slider and compare the original and modified images.
7. **Save the Image**: Click the "Save" button to download the image with the applied whitening effect.

## Code Structure

- **`index.html`**: The main HTML file that loads the Banuba SDK and initializes the player and comparison slider.
- **`index.js`**: The primary JavaScript file that manages the player setup, image loading, whitening effect application, and comparison slider functionality.
- **`style.css`**: The CSS file for styling the HTML elements.
- **`token.js`**: Contains the Banuba SDK token required for operation.
- **`teeth_tone.zip`**: Includes the assets for the VITA Shade teeth whitening effect.

## Notes

- Ensure you have a webcam and an image file to fully experience the example.
- If you launch `index.html` without a valid token, the page will display some elements, but the camera will not launch, preventing you from using the full functionality. Please make sure to insert the correct token in `token.js`.
- The VITA Shade colors can be customized upon request; however, default values (official ones from the VITA Shade system) are hardcoded inside `teeth_tone.zip`.
- Two parameters in `index.js` are crucial for realistic color overlay:
  - **`darkTransparency`**: Controls the degree of overlay in dark areas of the tooth (range 0-1).
  - **`nonLinear`**: Adjusts the strength of overlay (range 0-4).

  These parameters help display colors realistically in non-ideal lighting conditions, such as at home or in an office, rather than in a professional photo studio. They are sensitive to the white balance in images and videos. If the teeth whitening effect appears unrealistic or insufficiently white in your tests, consider adjusting these values to achieve the desired result.