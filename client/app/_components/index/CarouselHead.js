import { useState } from 'react'
import Carousel from 'react-bootstrap/Carousel'
import Image from 'next/image'
import styles from '@/styles/index/index.module.css'
import ImageBg1 from '@/public/img/hui/space/2151264449.jpg'
import ImageBg2 from '@/public/img/hui/space/high-angle-desk-arrangement.jpg'
import ImageBg3 from '@/public/img/hui/space/soft-pastel-hues-room-kids.jpg'
import ImageCarousels01 from '@/public/img/hui/carousels01.jpg'
import ImageCarousels02 from '@/public/img/hui/carousels02.jpg'
import ImageCarousels03 from '@/public/img/hui/carousels03.jpg'

export default function CarouselHead() {
  const [selectedImage, setSelectedImage] = useState(0) // 預設第一張

  return (
    <>
      <div className={styles.carouselWrapper}>
        <Carousel
          fade
          controls={false}
          interval={null}
          activeIndex={selectedImage}
          onSelect={(selectedIndex) => setSelectedImage(selectedIndex)}
        >
          <Carousel.Item className={styles.sectionContent}>
            <div className={styles.imageWrapper}>
              <Image
                src={ImageBg1}
                alt="First slide"
                className={styles.headBg}
              />
            </div>
          </Carousel.Item>

          <Carousel.Item className={styles.sectionContent}>
            <div className={styles.imageWrapper}>
              <Image
                src={ImageBg2}
                alt="First slide"
                className={styles.headBg}
              />
            </div>
          </Carousel.Item>

          <Carousel.Item className={styles.sectionContent}>
            <div className={styles.imageWrapper}>
              <Image
                src={ImageBg3}
                alt="First slide"
                className={styles.headBg}
              />
            </div>
          </Carousel.Item>
        </Carousel>
        {/* 文字+圖片 */}
        <div className={`d-flex ${styles.textAndImg}`}>
          {/* 文字內容*/}
          <div
            className={`d-flex text-center text-lg-start flex-column ${styles.leftView}`}
          >
            {selectedImage === 0 && (
              <div>
                <div className={styles.leftTitle}>
                  <h1 className="text-white">
                    木頭教我們，
                    <br />
                    留下紋理，也留下故事。
                  </h1>
                  <p className="text-white">
                    我們從自然中汲取靈感，選擇貼近木質與生活感的材料與設計。
                  </p>
                </div>
                <p className="text-white d-none d-lg-block">A design note by Okaly.</p>
              </div>
            )}

            {selectedImage === 1 && (
              <div>
                <div className={styles.leftTitle}>
                  <h1 className="text-white">
                    留給專注一點時間，
                    <br />
                    也是種生活。
                  </h1>
                  <p className="text-white">
                    我們相信，工作空間不必完美，
                    <br />
                    但要剛剛好地容納思緒、節奏與呼吸。
                  </p>
                </div>
                <p className="text-white d-none d-lg-block">A design note by Okaly.</p>
              </div>
            )}

            {selectedImage === 2 && (
              <div>
                <div className={styles.leftTitle}>
                  <h1 className="text-white">
                    不是空間被填滿， <br />
                    而是生活正在發生。
                  </h1>
                  <p className="text-white">
                    我們設計能被共用、共存的家具， <br />
                    讓生活中多一點陪伴，而不是界線。
                  </p>
                </div>
                <p className="text-white d-none d-lg-block">A design note by Okaly.</p>
              </div>
            )}
          </div>
          {/* 圖片點選區域 */}
          <div className={`${styles.rightView}`}>
            <div
              className={`${styles.headRight} ${styles[`slide${selectedImage}`]}`}
            >
              <Image
                src={ImageCarousels01}
                alt="Product 1"
                className={`${styles.galleryImage} ${selectedImage === 0 ? styles.selected : ''}`}
                onClick={() => setSelectedImage(0)}
              />
              <Image
                src={ImageCarousels02}
                alt="Product 2"
                className={`${styles.galleryImage} ${selectedImage === 1 ? styles.selected : ''}`}
                onClick={() => setSelectedImage(1)}
              />
              <Image
                src={ImageCarousels03}
                alt="Product 3"
                className={`${styles.galleryImage} ${selectedImage === 2 ? styles.selected : ''}`}
                onClick={() => setSelectedImage(2)}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
