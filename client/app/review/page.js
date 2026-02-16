"use client"

import React, { useState, useEffect, useRef } from 'react';
import '@/styles/review/review.css';
import Swal from 'sweetalert2';



const Review = ({ productId = 1 }) => {
  const [rating, setRating] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [sortBy, setSortBy] = useState('newest');
  const [sortOptions, setSortOptions] = useState([]);
  const [statistics, setStatistics] = useState({
    averageRating: '0.0',
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  // 處理圖片選擇
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const maxImages = 5;
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    if (images.length + files.length > maxImages) {
      Swal.fire({
        icon: 'warning',
        title: '圖片數量限制',
        text: `最多只能上傳 ${maxImages} 張圖片`,
        confirmButtonColor: '#DBA783'
      });
      return;
    }

    const validFiles = [];
    const validPreviews = [];

    files.forEach(file => {
      // 檢查檔案大小
      if (file.size > maxFileSize) {
        Swal.fire({
          icon: 'error',
          title: '檔案過大',
          text: `${file.name} 超過 5MB，請選擇較小的圖片`,
          confirmButtonColor: '#DBA783'
        });
        return;
      }

      // 檢查檔案類型
      if (!file.type.startsWith('image/')) {
        Swal.fire({
          icon: 'error',
          title: '檔案格式錯誤',
          text: `${file.name} 不是有效的圖片格式`,
          confirmButtonColor: '#DBA783'
        });
        return;
      }

      validFiles.push(file);

      // 建立預覽
      const reader = new FileReader();
      reader.onload = (e) => {
        validPreviews.push({
          id: Date.now() + Math.random(),
          url: e.target.result,
          file: file
        });

        if (validPreviews.length === validFiles.length) {
          setImages(prev => [...prev, ...validPreviews]);
          setImageFiles(prev => [...prev, ...validFiles]);
        }
      };
      reader.readAsDataURL(file);
    }); // 清空 input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 刪除圖片
  const removeImage = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
    setImageFiles(prev => {
      const imageToRemove = images.find(img => img.id === imageId);
      return prev.filter(file => file !== imageToRemove?.file);
    });
  };

  // 上傳圖片到後端
  const uploadImages = async () => {
    if (imageFiles.length === 0) return [];

    const formData = new FormData();
    imageFiles.forEach((file, index) => {
      formData.append(`images`, file);
    });

    try {
      // 後端設定進行調整
      const response = await fetch('http://localhost:3005/api/upload/review-images', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('圖片上傳失敗');

      const result = await response.json();
      return result.imageUrls || [];
    } catch (error) {
      console.error('圖片上傳錯誤:', error);
      throw error;
    }
  };



  // 獲取評論
  const fetchReviews = async (sort = 'newest') => {
    try {
      const response = await fetch(`http://localhost:3005/api/products/${productId}/reviews?sortBy=${sort}`);
      if (!response.ok) throw new Error('網路錯誤');
      const result = await response.json();
      if (result.status === 'success') {
        // 現在後端回傳的格式是 { data: { reviews, pagination, statistics } }
        setReviews(result.data.reviews);
        if (result.data.statistics) {
          setStatistics(result.data.statistics);
        }
      }
    } catch (error) {
      console.error('獲取評論失敗:', error);
    }
  };
  const fetchSortOptions = async () => {
    try {
      const response = await fetch('http://localhost:3005/api/reviews/sort-options');
      const result = await response.json();
      if (result.status === 'success') {
        setSortOptions(result.data.sortOptions);
      }
    } catch (error) {
      console.error('獲取排序選項失敗:', error);
    }
  };

  // 格式化時間
  const formatTime = (dateString) => {
    const days = Math.floor((new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24));
    if (days === 0) return '今天';
    if (days < 30) return `${days}天前`;
    return `${Math.floor(days / 30)}個月前`;
  };

  // 表單驗證
  const validateForm = async () => {
    if (rating === 0) {
      await Swal.fire({
        icon: 'warning',
        title: '請選擇評分',
        text: '請先給商品評分後再提交',
        confirmButtonColor: '#DBA783'
      });
      return false;
    }
    if (!name.trim()) {
      await Swal.fire({
        icon: 'error',
        title: '姓名不能為空',
        text: '請輸入您的姓名',
        confirmButtonColor: '#DBA783'
      });
      return false;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await Swal.fire({
        icon: 'error',
        title: 'Email 格式錯誤',
        text: '請輸入有效的Email地址',
        confirmButtonColor: '#DBA783'
      });
      return false;
    }
    if (!comment.trim()) {
      await Swal.fire({
        icon: 'info',
        title: '請填寫評論內容',
        text: '分享您對商品的使用體驗吧！',
        confirmButtonColor: '#DBA783'
      });
      return false;
    }
    return true;
  };



  const handleSubmit = async (e) => {
    e.preventDefault();

    // 表單驗證
    const isValid = await validateForm();
    if (!isValid) return;

    // ===== Token 驗證 (目前註解掉，之後啟用) =====
    // const token = localStorage.getItem('authToken');
    // const userId = localStorage.getItem('userId');
    // if (!token || !userId) {
    //   await Swal.fire({
    //     icon: 'warning',
    //     title: '請先登入',
    //     text: '登入會員才能提交評論',
    //     confirmButtonText: '前往登入',
    //     confirmButtonColor: '#DBA783'
    //   });
    //   // 這裡可以導向登入頁面
    //   // window.location.href = '/login';
    //   return;
    // }

    // 顯示載入中
    Swal.fire({
      title: '提交中...',
      text: '正在上傳圖片和評論',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // 先上傳圖片
      let imageUrls = [];
      if (imageFiles.length > 0) {
        imageUrls = await uploadImages();
      }

      // ===== 測試環境用的假資料 (之後改用真實 token 資料) =====
      const testUserId = 1; // 之後改為: const userId = localStorage.getItem('userId');

      // 提交評論
      const response = await fetch('http://localhost:3005/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // ===== 之後啟用 token 驗證 =====
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: testUserId, // 之後改為: userId
          product_id: productId,
          rating,
          email,
          comment,
          user_name: name,
          avatar: `https://i.pravatar.cc/150?u=${name}`,
          reviews_img: imageUrls.join(',')
        })
      });

      const result = await response.json();

      // 關閉載入中
      Swal.close();

      if (result.status === 'success') {
        await Swal.fire({
          icon: 'success',
          title: '評論提交成功！',
          text: '感謝您的寶貴意見',
          confirmButtonColor: '#DBA783',
          timer: 3000,
          timerProgressBar: true
        });

        // 清空表單
        setRating(0);
        setName('');
        setEmail('');
        setComment('');
        setImages([]);
        setImageFiles([]);
        fetchReviews();
      } else {
        await Swal.fire({
          icon: 'error',
          title: '提交失敗',
          text: result.message || '請稍後再試',
          confirmButtonColor: '#DBA783'
        });
      }
    } catch (error) {
      Swal.close();
      console.error('提交評論失敗:', error);
      await Swal.fire({
        icon: 'error',
        title: '提交失敗',
        text: '請稍後再試',
        confirmButtonColor: '#DBA783'
      });
    }
  };
  useEffect(() => {
    fetchReviews(sortBy);
; fetchSortOptions();
  }, [productId]);
  const averageRating = statistics.averageRating || '0.0';


  const getRatingDistribution = () => {
    if (!statistics.ratingDistribution) return [0, 0, 0, 0, 0];
    const total = statistics.totalReviews || 1;
    return [
      Math.round((statistics.ratingDistribution[1] / total) * 100),
      Math.round((statistics.ratingDistribution[2] / total) * 100),
      Math.round((statistics.ratingDistribution[3] / total) * 100),
      Math.round((statistics.ratingDistribution[4] / total) * 100),
      Math.round((statistics.ratingDistribution[5] / total) * 100),
    ];
  };

  const distribution = getRatingDistribution();


  return (
    <div className="review-page">
      {/* 評論總覽區塊 */}
      <section className="review-summary">
        <div className="rating-overview">
          <div className="average-rating">
            <div className="rating-number">{averageRating}</div>
            <div className="rating-stars">
              {[...Array(5)].map((_, i) => (
                <i key={i} className={`fas fa-star ${i < Math.round(averageRating) ? 'filled' : ''}`}></i>
              ))}
            </div>
            <div className="review-count">{statistics.totalReviews}則評論</div>
            </div>
          <div className="rating-distribution">
            {[5, 4, 3, 2, 1].map((star, index) => (
              <div key={star} className="rating-bar">
                <span>{star}星</span>
                <div className="bar-container">
                  <div className="bar" style={{ width: `${distribution[star - 1]}%` }}></div>
                </div>
                <span>{distribution[star - 1]}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 個別評論區塊 */}
      <section className="review-list">
        <div className="review-controls">
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              fetchReviews(e.target.value);
            }}
            className="sort-select"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>
        {reviews.map((review) => (
          <div key={review.id} className="review-item">
            <div className="user-info">
              <img
                src={review.avatar}
                alt={review.user_name}
                className="user-avatar"
              />
              <div className="user-details">
                <div className="user-name">{review.user_name}</div>
                <div className="review-time">{formatTime(review.created_at)}</div>
              </div>
            </div>
            <div className="review-rating">
              {[...Array(5)].map((_, i) => (
                <i key={i} className={`fas fa-star ${i < review.rating ? 'filled' : ''}`}></i>
              ))}
            </div>
            <div className="review-text">
              {review.comment}
            </div>

            {/* 顯示評論圖片 */}
            {review.reviews_img && (
              <div className="review-images">
                {review.reviews_img.split(',').map((imageUrl, index) => (
                  <img
                    key={index}
                    src={`http://localhost:3005${imageUrl}`}
                    alt={`評論圖片 ${index + 1}`}
                    className="review-image"
                    onClick={() => {
                      // 點擊放大圖片
                      Swal.fire({
                        imageUrl: `http://localhost:3005${imageUrl}`,
                        imageAlt: `評論圖片 ${index + 1}`,
                        showConfirmButton: false,
                        showCloseButton: true,
                        border: 'none',
                      });
                    }}
                  />
                ))}
              </div>
            )}

            <div className="review-engagement">
              <div className="thumbs-up">
                <i className="fas fa-thumbs-up"></i>
                <span>0</span>
              </div>
              <div className="thumbs-down">
                <i className="fas fa-thumbs-down"></i>
                <span>0</span>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* 撰寫評論區塊 */}
      <section className="write-review">
        <h2>寫下您的評論</h2>
        <form onSubmit={handleSubmit}>
          <div className="rating-input">
            {[...Array(5)].map((_, i) => (
              <i
                key={i}
                className={`fas fa-star ${i < rating ? 'filled' : ''}`}
                onClick={() => setRating(i + 1)}
              ></i>
            ))}
          </div>
          {/* 圖片上傳區域 */}
          <div className="image-upload-section">
            <label className="upload-label">
              <i className="fas fa-camera"></i>
              上傳圖片 (最多5張，每張最大5MB)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />

            {/* 預設圖片或已選擇的圖片 */}
            <div className="image-preview-container">
              {images.length === 0 ? (
                // 預設圖片 - 點擊選擇
                <div
                  className="default-image-placeholder"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <i className="fas fa-camera"></i>
                  <span>點擊選擇圖片</span>
                </div>
              ) : (
                // 顯示已選擇的圖片
                images.map((image) => (
                  <div key={image.id} className="image-preview">
                    <img src={image.url} alt="預覽" />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => removeImage(image.id)}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))
              )}

              {/* 如果已有圖片但未達上限，顯示添加按鈕 */}
              {images.length > 0 && images.length < 5 && (
                <div
                  className="add-more-image"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <i className="fas fa-plus"></i>
                </div>
              )}
            </div>
          </div>

          <div className="form-row">
            <input
              type="text"
              placeholder="姓名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <textarea
            placeholder="談談你對傢俱質感、配色、舒適度的看法"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          ></textarea>
          <div className="form-buttons">
            <button type="submit" className="submit-btn">送出</button>
            <button type="button" className="return-btn">返回</button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default Review;