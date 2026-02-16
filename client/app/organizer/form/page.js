"use client";
//react
import { useState, useEffect, useRef } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { useRouter } from "next/navigation";

// toast
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";

// 針對單一頁面使用css modules技術
import styles from "@/styles/organizer/organizer.module.css";

// 自訂組件(全域)
import GreenBorderButton from "@/app/_components/GreenBorderButton";
//自訂組件 整理師專用
import Hero from "../_components/Hero";

export default function FormPage() {
  const router = useRouter();

  const [SelectedOrganizers, setSelectedOrganizers] = useState(""); //整理師
  const [selectedCity, setSelectedCity] = useState(""); //縣市
  const [selectedDistrict, setSelectedDistrict] = useState(""); //區域
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [address, setAddress] = useState(""); // 詳細地址
  const [serviceDate, setServiceDate] = useState(""); // 服務日期
  const [note, setNote] = useState(""); // 備註
  const [isConfirmed, setIsConfirmed] = useState(false); // 確認checkbox
  const [selectedFiles, setSelectedFiles] = useState([]); // 上傳的檔案

  // 登入相關的 state
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  // 圖片的input 創建 ref 來控制 input
  const fileInputRef = useRef(null);


  // 所有 useFetch 都在這裡
  const userResult = useFetch(
    isReady && token ? `http://localhost:3005/api/users/profile` : null, // 改成不需要 userId 的端點
    {
      headers: { 'Authorization': `Bearer ${token}` },
      key: isReady && token ? 'user-profile' : null
    }
  );
  const organizerResult = useFetch("http://localhost:3005/api/organizers");
  const taiwanResult = useFetch("/TwCities.json");

  // 定義所有變數讓 useEffect 可以使用
  const currentUser = userResult.data ? userResult.data.data : null;
  const organizers = organizerResult.data ? organizerResult.data.data : [];
  const taiwanData = taiwanResult.data || [];

  // 處理登入
  useEffect(() => {
    const tokenFromStorage = localStorage.getItem("reactLoginToken");

    //沒登入的跳轉
    if (!tokenFromStorage) {
      router.push("/auth/login");
      return;
    }

    setToken(tokenFromStorage);
    setIsReady(true);
    setIsLoading(false);
  }, [router]);

  // 當 API 返回用戶資料時設置表單
  useEffect(() => {
    if (currentUser) {
      setUserForm({
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone,
      });
    }
  }, [currentUser]);

  
  //使用fetch錯誤處理
  if (userResult.error && !userResult.data) {
    console.error("載入使用者資料失敗:", userResult.error);
  }
  if (organizerResult.error) {
    console.error("載入整理師資料失敗:", organizerResult.error);
  }
  if (taiwanResult.error) {
    console.error("載入地區失敗:", taiwanResult.error);
  }

  // 圖片上傳
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    //限制4張
    if (files.length > 4) {
      Swal.fire({ title: "請最多只能上傳4張圖片!", confirmButtonColor: "#6f9b8c" });
      e.target.value = "";
      return;
    }
    setSelectedFiles(files);
  };

  //日期選擇
  const getMinDate = () => {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 14);
    return minDate.toISOString().split("T")[0];
  };

  // 地區北中南的地區分類
  const cityRegionMap = {
    // 北部 - 1
    臺北市: 1,
    新北市: 1,
    桃園市: 1,
    基隆市: 1,
    新竹市: 1,
    新竹縣: 1,
    // 中部 - 2
    臺中市: 2,
    苗栗縣: 2,
    彰化縣: 2,
    南投縣: 2,
    雲林縣: 2,
    // 南部 - 3
    嘉義市: 3,
    嘉義縣: 3,
    臺南市: 3,
    高雄市: 3,
    屏東縣: 3,
  };


  const handleDivClick = () => {
    fileInputRef.current.click();
  };

  // 收集所有表單的資料
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 確認要勾
    if (!isConfirmed) {
      Swal.fire({ title: "請確認資訊後，勾選確認框！", confirmButtonColor: "#6f9b8c" });
      return;
    }

    if (selectedFiles.length === 0) {
      Swal.fire({ title: "請上傳至少一張照片！", confirmButtonColor: "#6f9b8c" });
      return;
    }

    const formData = new FormData();

    // 加入一般資料
    formData.append("city", selectedCity);
    formData.append("district", selectedDistrict);
    formData.append("address", address);
    formData.append("organizer_id", SelectedOrganizers);
    formData.append("service_datetime", serviceDate);
    formData.append("note", note);

    selectedFiles.forEach((file, index) => {
      formData.append("photos", file);
    }); //圖片檔案

    console.log("檔案數量:", selectedFiles.length);

    // 送出資料
    try {
      const response = await fetch(
        "http://localhost:3005/api/user/organizers/add",
        {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("提交成功:", result);
        router.push("/organizer/form/success"); // 導向成功頁面
      } else {
        Swal.fire({ title: "表單請填寫完整", confirmButtonColor: "#6f9b8c" });
      }
    } catch (error) {
      console.error("提交錯誤:", error);
      alert("網路錯誤，請檢查連線");
    }
  };
  return (
    <>
      <Hero />
      <section>
        <div className="container-xl">
          <div
            className={`d-flex flex-column gap-xxxl section  ${styles.maxWidth960}`}
          >

            <h2 className="t-primary01 text-center">整理服務諮詢</h2>
            {!isReady ?
              <div className="d-flex justify-content-center align-items-center w-100" style={{ minHeight: '200px' }}>
                <div className="loaderLine"></div>
              </div> :
              <form action="" method="POST" className="d-flex flex-column">
                {/* 第一個 row - 姓名 + 手機 */}
                <div className="row">
                  <div className="col-12 col-md-6 mb-xl">
                    <label
                      htmlFor="name"
                      className="form-label t-primary03 label700"
                    >
                      姓名*
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="form-control"
                      value={userForm.name}
                      readOnly
                      disabled
                      tabIndex="-1"
                    />
                  </div>
                  <div className="col-12 col-md-6 mb-xl">
                    <label
                      htmlFor="phone"
                      className="form-label t-primary03 label700"
                    >
                      手機號碼*
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className="form-control"
                      value={userForm.phone}
                      readOnly
                      disabled
                      tabIndex="-1"
                    />
                  </div>
                </div>
                {/* 第二個 row - 信箱獨立一行 */}
                <div className="row">
                  <div className="col-12 mb-xl">
                    <label
                      htmlFor="email"
                      className="form-label t-primary03 label700"
                    >
                      信箱*
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-control"
                      value={userForm.email}
                      readOnly
                      disabled
                      tabIndex="-1"
                    />
                  </div>
                </div>
                {/* 服務地址區塊 */}
                <div className="row">
                  <div className="col-12">
                    <label className="form-label t-primary03 label700">
                      服務地址*
                    </label>
                  </div>
                  <div className="col-12 col-md-6 col-lg-3">
                    <select
                      value={selectedCity}
                      onChange={(e) => {
                        setSelectedCity(e.target.value);
                        setSelectedDistrict("");
                      }}
                      className="form-select mb-sm"
                      name="city"
                      required
                    >
                      <option value="" disabled>
                        請選擇縣市
                      </option>
                      {taiwanData.map((city) => (
                        <option key={city.name} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 col-md-6 col-lg-3">
                    <select
                      value={selectedDistrict}
                      onChange={(e) => {
                        setSelectedDistrict(e.target.value);
                      }}
                      className="form-select mb-sm"
                      name="district"
                      required
                    >
                      <option value="" disabled>
                        請選擇區域
                      </option>
                      {taiwanData
                        .find((city) => city.name === selectedCity)
                        ?.districts.map((district) => (
                          <option key={district.name} value={district.name}>
                            {district.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="col-12 col-lg-6 mb-xl">
                    <input
                      type="text"
                      className="form-control"
                      name="address"
                      placeholder="請輸入詳細地址"
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                      }}
                      required
                    />
                  </div>
                </div>
                {/* 選整理師+日期 */}
                <div className="row">
                  <div className="col-12 col-md-6 mb-xl">
                    <label className="form-label t-primary03 label700">
                      選擇整理師*
                    </label>
                    <select
                      value={SelectedOrganizers}
                      onChange={(e) => {
                        setSelectedOrganizers(e.target.value);
                      }}
                      className="form-select"
                      name="organizer"
                      required
                      disabled={!selectedCity}
                    >
                      <option value="" disabled>
                        {!selectedCity ? "請先選擇縣市地址" : "選擇整理師"}
                      </option>
                      {selectedCity &&
                        organizers
                          .filter(
                            (organizer) =>
                              organizer.region === cityRegionMap[selectedCity]
                          )
                          .map((organizer) => (
                            <option key={organizer.id} value={organizer.id}>
                              {organizer.name}
                            </option>
                          ))}
                    </select>
                  </div>
                  <div className="col-12 col-md-6 mb-xl">
                    <label className="form-label t-primary03">
                      <span className="label700">希望服務日期*</span>
                      （為確保最佳服務品質，請選擇2週後的日期）
                    </label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      className="form-control"
                      min={getMinDate()}
                      value={serviceDate}
                      onChange={(e) => setServiceDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                {/* 上傳照片 */}
                <div className="row">
                  <div className="col-12">
                    <label className="form-label t-primary03 label700">
                      上傳整理環境照片*
                    </label>
                    <input
                      type="file"
                      name="img"
                      id="img"
                      accept=".png,.jpg,.jpeg"
                      multiple
                      required
                      className="d-none"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    <div className="d-flex gap-3 flex-wrap">
                      <div
                        onClick={handleDivClick}
                        className={`d-flex justify-content-center align-items-center ${styles.imgAdd}`}
                      >
                        <div className={styles.imgAddImg}></div>
                      </div>

                      {/* 預覽圖片們 */}
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="position-relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`預覽圖片 ${index + 1}`}
                            className={styles.previewImg}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="t-primary03 mb-xl mt-sm">
                      可上傳 1～4 張圖片，協助我們了解您的空間狀況
                      <br />
                      支援格式：.jpg、.jpeg、.png，建議每張 ≤ 5MB
                    </p>
                  </div>
                </div>
                {/* 備註 */}
                <div className="row">
                  <div className="col-12">
                    <label className="form-label t-primary03 label700">
                      備註
                    </label>
                    <textarea
                      name="note"
                      id="note"
                      rows="4"
                      placeholder="請填寫特殊需求或想告訴整理師的事項（例如：寵物、家中空間限制…）"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="form-control mb-xl"
                    ></textarea>
                  </div>
                </div>
                <label className="t-primary03 mb-xl text-xl-center">
                  <input
                    type="checkbox"
                    name="confirm"
                    id="confirm"
                    className="form-check-input me-2 "
                    checked={isConfirmed}
                    onChange={(e) => {
                      setIsConfirmed(e.target.checked);
                    }}
                  />
                  請確認以上資訊無誤，整理師將依據您提供的資料安排聯繫！
                </label>
                <div className="d-flex justify-content-center">
                  <GreenBorderButton onClick={handleSubmit}>
                    提交表單
                  </GreenBorderButton>
                </div>
              </form>
            }
          </div>
        </div>
      </section>
    </>
  );
}
