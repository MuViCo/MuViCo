import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Body from "./Body";
import ImageContainer from './ImageContainer';
import photoService from "../../services/photos"

/**
 * Component for displaying photos.
 * @returns {JSX.Element} Rendered component.
 */
const PhotoPage = () => {
    const [images, setImages] = useState([]);

    /**
     * Fetches images from the server.
     */
    useEffect(() => {
        fetchImages();
    }, []);

    /**
     * Fetches images from the server.
     */
    const fetchImages = async () => {
        try {
            const response = await photoService.photos();
            setImages(response.data);
        } catch (error) {
            console.error('Error fetching images:', error);
        }
    };

    return (
        <>
            <Body />
            <ImageContainer images={images} />
        </>
    );
}

export default PhotoPage;
