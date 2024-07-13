//slideShowComponent.jsx

import { useState } from 'react';
import image1 from '../../assets/image1.jpg';
import image2 from '../../assets/image2.jpg';
import image3 from '../../assets/image3.avif';
import style from './SlideShowComponent.module.css';

export default function SlideShow() {
    const [slideIndex, setSlideIndex] = useState(0);

    const slideShowContent = [
        {
            imageSrc: image1,
            title: 'See everyone together',
            description: 'To see more people at the same time, go to Change layout in the More options menu',
        },
        {
            imageSrc: image2,
            title: 'Get a link you can share',
            description: 'Click Create to get a link you can send to people you want to meet with',
        },
        {
            imageSrc: image3,
            title: 'Your meeting is safe',
            description: 'No one outside your organization can join a meeting unless invited or admitted by the host',
        }
    ];

    const prevSlide = () => {
        setSlideIndex((slideIndex - 1 + slideShowContent.length) % slideShowContent.length);
    };

    const nextSlide = () => {
        setSlideIndex((slideIndex + 1) % slideShowContent.length);
    };

    return (
        <div className={style.gridContainer}>
            <div className={style.gridButtonContainer}>
                <button className={style.gridButton} onClick={prevSlide}>&lt;</button>
            </div>
            <div className={style.gridItem}>
                <img src={slideShowContent[slideIndex].imageSrc} alt={slideShowContent[slideIndex].title} className={style.image}/>
                <h2>{slideShowContent[slideIndex].title}</h2>
                <p>{slideShowContent[slideIndex].description}</p>
            </div>
            <div className={style.gridButtonContainer}>
                <button className={style.gridButton} onClick={nextSlide}>&gt;</button>
            </div>
        </div>
    );
}
