import { useState } from 'react';
import image1 from '../../assets/image1.jpg';
import image2 from '../../assets/image2.jpg';
import image3 from '../../assets/image3.avif';
import style from './SlideShowComponent.module.css';
import usePreloadImages from '../../hooks/usePreloadImages';

export default function SlideShow() {
  const slides = [
    {
      imageSrc: image1,
      title: 'See everyone together',
      description:
        'To see more people at the same time, go to Change layout in the More options menu',
    },
    {
      imageSrc: image2,
      title: 'Get a link you can share',
      description:
        'Click Create to get a link you can send to people you want to meet with',
    },
    {
      imageSrc: image3,
      title: 'Your meeting is safe',
      description:
        'No one outside your organization can join a meeting unless invited or admitted by the host',
    },
  ];

  const allLoaded = usePreloadImages(slides.map((s) => s.imageSrc));
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % slides.length);
      setIsAnimating(false);
    }, 400);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setIndex((prev) => (prev - 1 + slides.length) % slides.length);
      setIsAnimating(false);
    }, 400);
  };

  if (!allLoaded) {
    return (
      <div className={style.loadingContainer}>
        <div className={style.spinner}></div>
        <p>Loading slideshow...</p>
      </div>
    );
  }

  const current = slides[index];

  return (
    <div className={style.gridContainer}>
      {/* Left button (desktop/tablet) */}
      <div className={style.gridButtonContainer}>
        <button
          className={style.gridButton}
          onClick={prevSlide}
          disabled={isAnimating}
        >
          &lt;
        </button>
      </div>

      {/* Main content */}
      <div className={`${style.gridItem} ${isAnimating ? style.fadeOut : style.fadeIn}`}>
        <img src={current.imageSrc} alt={current.title} className={style.image} />
        <h2>{current.title}</h2>
        <p>{current.description}</p>
      </div>

      {/* Right button (desktop/tablet) */}
      <div className={style.gridButtonContainer}>
        <button
          className={style.gridButton}
          onClick={nextSlide}
          disabled={isAnimating}
        >
          &gt;
        </button>
      </div>

      {/* Mobile-only bottom buttons */}
      <div className={style.mobileButtonBar}>
        <button
          className={style.gridButton}
          onClick={prevSlide}
          disabled={isAnimating}
        >
          &lt;
        </button>
        <button
          className={style.gridButton}
          onClick={nextSlide}
          disabled={isAnimating}
        >
          &gt;
        </button>
      </div>
    </div>
  );
}
