"use client";

import RecommendProduct from "@/app/article/_components/recommend-p";
import RecommendArticle from "@/app/article/_components/recommend-a";
import "@/styles/article/articleDetail.css";
import Image from "next/image";

export default function ArticleOnePage() {
  return (
    <>
      <div className="orange-background">
        <div className="container-fluid">
          <div className="article-background">
            <div className="article">
              <div className="bread-crumb">
                <h6 lang="en">home</h6>
              </div>
              <div className="t-line"></div>
              <div className="article-contents">
                <div className="article-titles">
                  <div className="article-category">
                    <h5 lang="zh">居家生活</h5>
                    <h6 lang="zh">居家生活</h6>
                  </div>
                  <div className="article-title">
                    <h2 lang="zh">
                      從設計到情感：家具如何塑造我們的生活空間與內在世界
                    </h2>
                    <h5>
                       從設計到情感：家具如何塑造我們的生活空間與內在世界
                    </h5>
                  </div>
                  {/* <div className="article-label">
                    <div className="aLabels">
                      <h6>#家具設計</h6>
                    </div>
                    <div className="aLabels">
                      <h6>#居家美學</h6>
                    </div>
                    <div className="aLabels">
                      <h6>#生活風格</h6>
                    </div>
                    <div className="aLabels">
                      <h6>#北歐風家具</h6>
                    </div>
                    <div className="aLabels">
                      <h6>#家具選購指南</h6>
                    </div>
                  </div> */}
                </div>
                <div className="article-Image">
                  <img
                    className="title-img"
                    src="/img/living-room.jpg"
                    alt=""
                    width={1196}
                    height={530}
                  />
                </div>
                <div className="contents">
                  <div className="content">
                    在現代人快節奏的生活裡，家具往往被視為一種「功能性配件」——我們用它來吃飯、睡覺、工作、休息。然而，真正了解家具的人都知道，它不只是生活的工具，更是空間的靈魂，是情感的投射，也是文化與品味的延伸。
                    一、家具的歷史：從功能到藝術的演進
                    自古以來，人類就不斷創造與演進家具。從古埃及石製座椅，到中世紀歐洲的雕花木椅，再到現代極簡的金屬結構沙發，家具隨著文明的演進而改變其形式與意義。最初，家具只是為了滿足基本的生理需求——一張能坐的椅子、一張能睡的床。然而，隨著設計理念的興起與手工藝的進步，家具逐漸演變為藝術的一部分，成為身份與品味的象徵。
                  </div>
                  <div className="content-Image">
                    <img
                      className="content-img"
                      src="/img/living-room.jpg"
                      alt=""
                    />
                  </div>
                  <div className="content">
                    二、設計與空間的對話
                    一件好的家具，從來都不只是「漂亮」，它需要懂得如何與空間「對話」。沙發的曲線、餐桌的高度、書櫃的比例，這些看似微不足道的細節，實則會影響一個空間的氛圍與使用者的情緒。例如，深色實木家具常帶有穩重與傳統的氣質，適合用於書房或古典風格空間；而淺色系或金屬框架的設計則常給人輕盈、現代、俐落的感覺。
                    當一個空間內的家具風格統一、尺寸合宜、動線順暢，整體居住體驗就會明顯提升。這種「看不見的設計」，才是真正改變生活品質的關鍵。
                  </div>
                  <div className="content-Image">
                    <img
                      className="content-img"
                      src="/img/living-room.jpg"
                      alt=""
                      width={918}
                      height={323}
                    />
                  </div>
                  <div className="content">
                    三、情感連結：家具也是家的記憶
                    每個人家中或許都有那麼一件特別的家具。也許是奶奶留下來的老書桌，也許是第一次搬進新家時買的餐桌，那些家具往往記錄著人生的重要時刻。一張餐桌，不只是用來吃飯，它也見證了一家人數不清的晚餐時光、朋友間的笑聲與爭論，甚至是一場場溫馨的生日派對。
                    這種情感連結，使得家具超越了「物件」的身份，成為家的一部分。很多人搬家時，即使願意捨棄電器、衣物，卻堅持要帶著那張舊椅子或那張磨損的茶几，因為那是他們記憶與歸屬的載體。
                  </div>
                  <div className="content">
                    四、風格選擇：找到與你共鳴的家具
                    現代家具的風格多樣，從溫潤的北歐木質風，到理性冷調的工業風；從高級感十足的義式奢華，到簡單自在的日式無印。每種風格都不僅是視覺語言，也反映了居住者的生活哲學。
                    喜歡北歐風的人，可能偏好自然、寧靜、有秩序的生活；而喜愛工業風的人，可能對原始、粗獷、個性化的風格情有獨鍾。選擇什麼樣的家具，就像是對外界表達自我的一種方式。
                  </div>
                  <div className="content">
                    五、永續與未來：家具設計的新價值觀
                    面對環境危機與資源枯竭，現代家具設計也逐漸轉向永續、環保與循環利用。許多品牌開始使用再生木材、竹材、回收塑料、無毒塗料，甚至發展模組化家具系統，讓使用者可以根據需求自由組裝、升級、延長家具壽命。
                    這不只是設計上的突破，更是一種對生活負責的態度。選擇一件耐用、環保的家具，不只是為自己打造美好的家居空間，更是在支持一種對地球友善的生活方式。
                  </div>
                  <div className="content">
                    結語：家具，不只是家具
                    家具不僅塑造了我們的空間，更深刻地影響著我們的生活習慣、情感連結與審美價值。它不只是你坐的椅子、睡的床、吃飯的桌子，它更是一種生活的語言，是家的語彙。
                    下一次當你選購家具，不妨放慢腳步，去理解它的材質、設計、工藝與故事，因為那不只是一件家具，而是你人生風景中的一個小宇宙。
                  </div>
                </div>
                <div className="article-info">
                  <div className="left-info">
                    <h5>作者：ABC 先生</h5>
                    <h5>
                      發佈日期：2025 / 07 / 18
                    </h5>
                  </div>
                  <div className="phone-left-info">
                    <h6>作者：ABC 先生</h6>
                    <h6>
                      發佈日期：2025 / 07 / 18
                    </h6>
                  </div>
                  <div className="right-info">
                    <button>
                      <i className="fa-regular fa-share-from-square"></i>
                    </button>
                    <button>
                      <i className="fa-regular fa-bookmark"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* ------------------------------------------- */}
            <div className="sub-article">
              <div className="sub-line"></div>
              <RecommendProduct />
              <RecommendArticle />

              <div>footer</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
