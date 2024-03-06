import React from 'react';
import Container from "../../services/photos"

/**
 * Component for displaying images.
 * @param {Object} props - Component props.
 * @param {string[]} props.images - Array of image filenames.
 * @returns {JSX.Element} Rendered component.
 */
function ImageContainer({ images }) {
    return (
        <div className="image-container">
            {images.map((imageName, index) => (
                <img key={index} src={`http://localhost:8000/api/photos/${imageName}`}  alt={`Photo ${index}`} />
            ))}
        </div>
    );
}
export default ImageContainer;
