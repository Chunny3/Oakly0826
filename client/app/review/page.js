"use client"

import React, { useState, useEffect, useRef } from 'react';
import '@/styles/review/review.css';
import Swal from 'sweetalert2';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

const Review = ({ productId = 1 }) => {
  const router = useRouter();
  const { user, isLoading } = useAuth();
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
  const [editingReview, setEditingReview] = useState(null);
  const [reactionCounts, setReactionCounts] = useState({});
  const editFileInputRef = useRef(null);

  const [editForm, setEditForm] = useState({
    rating: 0,
    comment: '',
    images: [],
    imageFiles: []
  });
  const [statistics, setStatistics] = useState({
    averageRating: '0.0',
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  const isAuthenticated = !!user && !isLoading;
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) {
      console.log('加载用户信息...');
      return;
    };

    if (!user || !user.id) {
      console.log('用户未登入:', { user, isLoading });

      const result = await Swal.fire({
        icon: 'warning',
        title: '請先登入',
        text: '登入會員才能提交評論',
        showCancelButton: true,
        confirmButtonText: '前往登入',
        cancelButtonText: '取消',
        confirmButtonColor: '#DBA783',
        allowOutsideClick: false
      });

      if (result.isConfirmed) {
        window.top.location.href = '/auth/login';
      }

      return;
    }

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
      // const testUserId = 1; // 之後改為: const userId = localStorage.getItem('userId');

      // 提交評論
      const response = await fetch('http://localhost:3005/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          user_id: user.id,
          product_id: productId,
          rating,
          email: user.email,
          comment,
          user_name: user.name,
          avatar: user.avatar || `https://i.pravatar.cc/150?u=${user.name}`,
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

  const handleImageSelect = (e, isEditMode = false) => {
    const files = Array.from(e.target.files);
    const maxImages = 5;
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    const currentImages = isEditMode ? editForm.images : images;

    if (currentImages.length + files.length > maxImages) {
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
      if (file.size > maxFileSize) {
        Swal.fire({
          icon: 'error',
          title: '檔案過大',
          text: `${file.name} 超過 5MB，請選擇較小的圖片`,
          confirmButtonColor: '#DBA783'
        });
        return;
      }

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

      const reader = new FileReader();
      reader.onload = (e) => {
        validPreviews.push({
          id: Date.now() + Math.random(),
          url: e.target.result,
          file: file,
          isNew: true
        });

        if (validPreviews.length === validFiles.length) {
          if (isEditMode) {
            setEditForm(prev => ({
              ...prev,
              images: [...prev.images, ...validPreviews],
              imageFiles: [...prev.imageFiles, ...validFiles]
            }));
          } else {
            setImages(prev => [...prev, ...validPreviews]);
            setImageFiles(prev => [...prev, ...validFiles]);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    // 清空 input
    if (isEditMode && editFileInputRef.current) {
      editFileInputRef.current.value = '';
    } else if (fileInputRef.current) {
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


  const startEdit = (review) => {
    console.log('startEdit 开始执行，review.id:', review.id);
    console.log('设置 editingReview 前:', editingReview);
    setEditingReview(review.id);

    console.log('设置 editingReview 后，应该变成:', review.id);


    setEditForm({
      rating: review.rating,
      comment: review.comment,
      images: review.reviews_img ? review.reviews_img.split(',').map((url, index) => ({
        id: `existing_${index}`,
        url: `http://localhost:3005${url}`,
        isExisting: true
      })) : [],
      imageFiles: []
    });
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingReview(null);
    setEditForm({ rating: 0, comment: '', images: [], imageFiles: [] });
  };

  const submitEdit = async (reviewId) => {
    try {
      if (!editForm.comment.trim()) {
        Swal.fire({
          icon: 'warning',
          title: '评论内容不能为空',
          confirmButtonColor: '#DBA783'
        });
        return;
      }

      if (editForm.rating === 0) {
        Swal.fire({
          icon: 'warning',
          title: '請選擇評分',
          confirmButtonColor: '#DBA783'
        });
        return;
      }

      // 上傳新圖片
      let newImageUrls = [];
      if (editForm.imageFiles.length > 0) {
        const formData = new FormData();
        editForm.imageFiles.forEach((file) => {
          formData.append(`images`, file);
        });

        const uploadResponse = await fetch('http://localhost:3005/api/upload/review-images', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          newImageUrls = uploadResult.imageUrls || [];
        }
      }

      // 合并现有图片和新图片
      const existingImages = editForm.images
        .filter(img => img.isExisting)
        .map(img => img.url.replace('http://localhost:3005', ''));

      const allImages = [...existingImages, ...newImageUrls];

      const response = await fetch(`http://localhost:3005/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('reactLoginToken')}`
        },
        body: JSON.stringify({
          rating: editForm.rating,
          comment: editForm.comment,
          reviews_img: allImages.join(',')
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        await Swal.fire({
          icon: 'success',
          title: '評論修改成功！',
          confirmButtonColor: '#DBA783'
        });
        cancelEdit();
        fetchReviews(sortBy);
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: '修改失败',
        text: '請聯絡客服'
      });
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('reactLoginToken');
    console.log('Token 存在:', !!token);
  }, []);


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
  // 删除评论
  const deleteReview = async (reviewId) => {
    const result = await Swal.fire({
      title: '確認删除',
      text: '删除後無法復原，確定要删除此評論嗎？',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: '確定删除',
      cancelButtonText: '取消'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`http://localhost:3005/api/reviews/${reviewId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('reactLoginToken')}`
          }
        });

        const deleteResult = await response.json();

        if (deleteResult.status === 'success') {
          await Swal.fire({
            icon: 'success',
            title: '删除成功',
            text: '評論已成功删除',
            confirmButtonColor: '#DBA783'
          });

          fetchReviews(sortBy);
        } else {
          await Swal.fire({
            icon: 'error',
            title: '删除失败',
            text: deleteResult.message || '請稍後再試',
            confirmButtonColor: '#DBA783'
          });
        }
      } catch (error) {
        console.error('删除評論失敗:', error);
        await Swal.fire({
          icon: 'error',
          title: '删除失败',
          text: '請稍後再試',
          confirmButtonColor: '#DBA783'
        });
      }
    }
  };
  const handleReaction = (reviewId, type) => {
    const storageKey = 'reviewReactions';
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');

    const newCounts = {
      ...saved,
      [reviewId]: {
        likes: saved[reviewId]?.likes || 0,
        dislikes: saved[reviewId]?.dislikes || 0,
        [type === 'like' ? 'likes' : 'dislikes']: (saved[reviewId]?.[type === 'like' ? 'likes' : 'dislikes'] || 0) + 1
      }
    };

    localStorage.setItem(storageKey, JSON.stringify(newCounts));
    setReactionCounts(newCounts);
  };

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('reviewReactions') || '{}');
    setReactionCounts(saved);
  }, []);

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
            {editingReview === review.id ? (
              // 编辑模式
              <div className="edit-review-form" style={{ border: '2px solid #DBA783', padding: '15px', borderRadius: '8px' }}>
                <h4>編輯評論</h4>

                <div className="edit-rating" style={{ marginBottom: '15px' }}>
                  <span>評分：</span>
                  {[...Array(5)].map((_, i) => (
                    <i
                      key={i}
                      className={`fas fa-star ${i < editForm.rating ? 'filled' : ''}`}
                      style={{ cursor: 'pointer', color: i < editForm.rating ? '#FFD700' : '#ccc', marginRight: '5px' }}
                      onClick={() => setEditForm(prev => ({ ...prev, rating: i + 1 }))}
                    />
                  ))}
                </div>
                <div className="edit-images" style={{ marginBottom: '15px' }}>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ marginRight: '10px' }}>圖片 (最多5張)：</label>
                    <input
                      ref={editFileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageSelect(e, true)}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      style={{
                        backgroundColor: '#DBA783',
                        color: 'white',
                        padding: '5px 10px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <i className="fas fa-camera"></i> 新增圖片
                    </button>
                  </div>

                  {editForm.images.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {editForm.images.map((image) => (
                        <div key={image.id} style={{ position: 'relative' }}>
                          <img
                            src={image.url}
                            alt="评论图片"
                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setEditForm(prev => ({
                                ...prev,
                                images: prev.images.filter(img => img.id !== image.id),
                                imageFiles: image.isNew
                                  ? prev.imageFiles.filter(file => file !== image.file)
                                  : prev.imageFiles
                              }));
                            }}
                            style={{
                              position: 'absolute',
                              top: '-5px',
                              right: '-5px',
                              background: 'red',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <textarea
                  value={editForm.comment}
                  onChange={(e) => setEditForm(prev => ({ ...prev, comment: e.target.value }))}
                  style={{ width: '100%', minHeight: '100px', padding: '10px', marginBottom: '15px' }}
                  placeholder="修改評論內容"
                />

                <div className="edit-buttons">
                  <button
                    onClick={() => submitEdit(review.id)}
                    style={{ backgroundColor: '#DBA783', color: 'white', padding: '8px 16px', marginRight: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    保存
                  </button>
                  <button
                    onClick={cancelEdit}
                    style={{ backgroundColor: '#ccc', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <>

                <div className="user-info">
                  <img src={review.avatar} alt={review.user_name} className="user-avatar" />
                  <div className="user-details">
                    <div className="user-name">{review.user_name} {user && review.user_id && review.user_id === user.id && (
                      <div className="review-actions">
                        <button onClick={() => startEdit(review)} className="edit-btn">
                          <i className="fas fa-edit"></i> 編輯
                        </button>
                        <button onClick={() => deleteReview(review.id)} className="delete-btn">
                          <i className="fas fa-trash"></i> 刪除
                        </button>
                      </div>
                    )}</div>
                    <div className="review-time">{formatTime(review.created_at)}</div>

                  </div>
                </div>
                <div className="review-rating">
                  {[...Array(5)].map((_, i) => (
                    <i key={i} className={`fas fa-star ${i < review.rating ? 'filled' : ''}`}></i>
                  ))}
                </div>
                <div className="review-text">{review.comment}</div>

                {review.reviews_img && (
                  <div className="review-images">
                    {review.reviews_img.split(',').map((imageUrl, index) => (
                      <img
                        key={index}
                        src={`http://localhost:3005${imageUrl}`}
                        alt={`評論圖片 ${index + 1}`}
                        className="review-image"
                        onClick={() => {
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
                  <div
                    className="thumbs-up"
                    onClick={() => handleReaction(review.id, 'like')}
                    style={{ cursor: 'pointer' }}
                  >
                    <i className="fas fa-thumbs-up"></i>
                    <span>{reactionCounts[review.id]?.likes || 0}</span>
                  </div>
                  <div
                    className="thumbs-down"
                    onClick={() => handleReaction(review.id, 'dislike')}
                    style={{ cursor: 'pointer' }}
                  >
                    <i className="fas fa-thumbs-down"></i>
                    <span>{reactionCounts[review.id]?.dislikes || 0}</span>
                  </div>
                </div>
              </>
            )}
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