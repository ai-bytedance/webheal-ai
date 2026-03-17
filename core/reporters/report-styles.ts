/**
 * report-styles.ts
 * Premium Report 样式模块 — 统一管理报告 CSS 变量、布局、组件样式
 */

export function getReportStyles(): string {
  return `<style>
        :root { 
          --bg-soft: #f1f5f9; 
          --side-bg: #1e293b;
          --side-active: rgba(99, 102, 241, 0.15);
          --text-deep: #1e293b; 
          --text-muted: #64748b; 
          --brand: #6366f1; 
          --brand-light: #e0e7ff;
          --success: #10b981; 
          --danger: #ef4444; 
          --border-light: #e2e8f0;
          --radius-xl: 24px;
          --radius-lg: 16px;
          --shadow-premium: 0 10px 30px -5px rgba(0, 0, 0, 0.05);
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body { 
          font-family: 'Outfit', 'Inter', -apple-system, sans-serif; 
          background: var(--bg-soft); 
          color: var(--text-deep); 
          height: 100vh;
          overflow: hidden;
        }

        .app-layout {
          display: flex;
          height: 100vh;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        /* ===== Sidebar ===== */
        .sidebar {
          width: 280px;
          background: var(--side-bg);
          display: flex;
          flex-direction: column;
          color: #fff;
          position: relative;
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
          overflow: hidden;
        }
        
        .sidebar-collapsed .sidebar { width: 0; }
        
        .sidebar-header { padding: 32px 24px; }
        .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        .logo-box { 
          width: 40px; height: 40px; 
          background: var(--brand); 
          border-radius: 12px; 
          display: flex; align-items: center; justify-content: center; 
          font-weight: 900; font-size: 14px; 
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4); 
          flex-shrink: 0;
        }
        .brand h2 { font-size: 16px; font-weight: 800; letter-spacing: -0.3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .module-search input {
          width: 100%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 12px 16px;
          border-radius: 12px;
          color: #fff;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
        }
        .module-search input:focus { border-color: var(--brand); }
        .module-search input::placeholder { color: rgba(255,255,255,0.3); }

        .sidebar-nav { flex: 1; padding: 0 16px; overflow-y: auto; }
        .nav-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-radius: 12px;
          cursor: pointer;
          margin-bottom: 6px;
          transition: all 0.2s;
          color: #94a3b8;
          white-space: nowrap;
        }
        .nav-item:hover { background: var(--side-active); color: #e0e7ff; }
        .nav-item.active { 
          background: var(--brand); 
          color: #fff; 
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); 
        }
        .nav-item.nav-child { padding-left: 36px; font-size: 0.85rem; }

        .nav-group { margin: 4px 0; }
        .nav-group-header {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 16px; cursor: pointer; border-radius: 10px;
          font-weight: 600; font-size: 0.92rem; color: var(--text-sub);
          transition: background 0.15s;
        }
        .nav-group-header:hover { background: var(--bg-hover); }
        .nav-group-arrow {
          font-size: 1.1rem; transition: transform 0.2s; display: inline-block; width: 12px;
        }
        .nav-group.is-collapsed .nav-group-arrow { transform: rotate(0deg); }
        .nav-group:not(.is-collapsed) .nav-group-arrow { transform: rotate(90deg); }
        .nav-group.is-collapsed .nav-group-children { display: none; }
        .nav-group-children { padding-left: 0; }
        .nav-icon { margin-right: 12px; font-size: 16px; }
        .nav-label { font-size: 14px; font-weight: 600; flex: 1; }
        .nav-count { 
          font-size: 11px; 
          background: rgba(255,255,255,0.1); 
          padding: 2px 8px; 
          border-radius: 20px; 
        }

        .sidebar-footer { padding: 24px; border-top: 1px solid rgba(255,255,255,0.06); }
        .exec-label { font-size: 10px; color: #64748b; font-weight: 800; letter-spacing: 0.5px; }
        .exec-value { font-size: 12px; color: #94a3b8; font-family: monospace; margin-top: 4px; }

        /* ===== Sidebar Toggle — 定位在 app-layout 层级 ===== */
        .sidebar-toggle {
          position: fixed;
          left: 265px;
          top: 32px;
          width: 30px;
          height: 30px;
          background: #fff;
          border: 1px solid var(--border-light);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          z-index: 200;
          transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s;
        }
        .sidebar-collapsed .sidebar-toggle { left: -1px; transform: rotate(180deg); }
        .toggle-arrow { 
          font-size: 18px; 
          color: var(--text-deep); 
          line-height: 1; 
          font-weight: 800; 
        }

        /* ===== Main Content ===== */
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .scroll-area { flex: 1; overflow-y: auto; padding: 24px 40px 40px 40px; }
        .content-wrapper { max-width: 1100px; margin: 0 auto; }

        /* ===== Premium Header Card ===== */
        .premium-header-card {
          background: #fff;
          border-radius: var(--radius-xl);
          padding: 40px;
          margin-bottom: 32px;
          position: relative;
          overflow: hidden;
          box-shadow: var(--shadow-premium);
          border: 1px solid var(--border-light);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        
        .header-main-info { flex: 1; }
        .header-actions { display: flex; align-items: center; gap: 12px; margin-left: 24px; }
        .env-status { 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          background: rgba(255,255,255,0.1); 
          padding: 6px 14px; 
          border-radius: 100px; 
          font-size: 13px; 
          color: #fff;
          margin-right: 12px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        /* ===== Inline Environment Badge ===== */
        .status-divider { color: #cbd5e1; font-weight: 400; margin: 0 4px; border: none; }
        
        .env-dot-small { width: 6px; height: 6px; border-radius: 50%; display: inline-block; margin-right: 4px; }
        .env-dot-small.prod { background: #ef4444; box-shadow: 0 0 6px rgba(239, 68, 68, 0.6); }
        .env-dot-small.preprod { background: #0ea5e9; box-shadow: 0 0 6px rgba(14, 165, 233, 0.6); }
        
        .env-name-small { font-weight: 850; letter-spacing: 0.5px; margin-right: 8px; }
        .env-name-small.prod { color: #ef4444; }
        .env-name-small.preprod { color: #0ea5e9; }
        
        .env-link-small { 
          color: var(--text-muted); 
          font-family: 'JetBrains Mono', monospace; 
          font-size: 11px; 
          text-transform: none; 
          letter-spacing: 0;
          text-decoration: none;
          padding: 3px 10px;
          background: #f1f5f9;
          border-radius: 6px;
          transition: all 0.2s;
          border: 1px solid #e2e8f0;
          display: inline-flex;
          align-items: center;
        }
        .env-link-small:hover {
          background: #e2e8f0;
          color: var(--brand);
          border-color: #cbd5e1;
        }
        
        .premium-header-card h1 { font-size: 26px; font-weight: 850; margin-bottom: 8px; color: #0f172a; }
        
        .conclusion-label { 
          font-size: 13px; 
          font-weight: 700; 
          color: var(--brand); 
          margin-bottom: 8px; 
          letter-spacing: 0.5px;
        }
        .conclusion-text { 
          color: var(--text-muted); 
          font-size: 14px; 
          line-height: 1.7;
        }
        
        .status-summary { 
          display: flex; align-items: center; gap: 8px; 
          margin-bottom: 16px; 
          font-weight: 800; font-size: 13px; 
          text-transform: uppercase; letter-spacing: 1px; 
        }
        .status-indicator { 
          width: 10px; height: 10px; 
          border-radius: 50%; 
          box-shadow: 0 0 10px currentColor; 
        }
        
        .header-stats-grid { 
          display: flex; gap: 40px; 
          margin-top: 32px; padding-top: 32px; 
          border-top: 1px solid var(--border-light); 
        }
        .h-stat-item { display: flex; flex-direction: column; gap: 4px; }
        .h-stat-label { font-size: 12px; color: var(--text-muted); font-weight: 600; }
        .h-stat-value { font-size: 18px; font-weight: 800; }

        .btn { 
          padding: 9px 22px; 
          border-radius: 10px; 
          font-weight: 700; 
          border: none; 
          cursor: pointer; 
          transition: all 0.2s; 
          font-size: 13px; 
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-outline { 
          background: #fff; 
          border: 1px solid var(--border-light); 
          color: var(--text-deep); 
        }
        .btn-outline:hover { border-color: var(--brand); color: var(--brand); }
        .btn-primary { 
          background: var(--brand); 
          color: #fff; 
        }
        .btn-primary:hover { background: #4f46e5; }

        /* ===== Share Modal & Card ===== */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .modal-overlay.active { display: flex; opacity: 1; }
        
        .share-card-container {
          background: #fff;
          border-radius: 32px;
          width: 480px;
          padding: 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          position: relative;
          transform: translateY(20px);
          transition: transform 0.3s;
        }
        .modal-overlay.active .share-card-container { transform: translateY(0); }
        
        .share-card-header { text-align: center; margin-bottom: 32px; }
        .share-card-header .logo-box { margin: 0 auto 16px; width: 56px; height: 56px; font-size: 20px; }
        .share-card-header h2 { font-size: 20px; font-weight: 850; color: #0f172a; margin-bottom: 4px; }
        .share-card-header p { font-size: 13px; color: var(--text-muted); }
        
        .share-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 32px;
        }
        .share-stat-item {
          background: #f8fafc;
          padding: 20px;
          border-radius: 20px;
          text-align: center;
          border: 1px solid #f1f5f9;
        }
        .share-stat-val { display: block; font-size: 24px; font-weight: 850; margin-bottom: 2px; }
        .share-stat-lab { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        
        .share-card-footer {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .close-modal-btn {
          width: 100%;
          padding: 14px;
          background: var(--brand);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-weight: 750;
          cursor: pointer;
          transition: background 0.2s;
        }
        .close-modal-btn:hover { background: #4f46e5; }
        .share-hint { font-size: 11px; color: #94a3b8; text-align: center; }

        /* ===== Stats Cards ===== */
        .stats-cards-grid { 
          display: grid; 
          grid-template-columns: repeat(4, 1fr); 
          gap: 24px; 
          margin-bottom: 40px; 
        }
        .stat-card-premium { 
          background: #fff; 
          border-radius: var(--radius-lg); 
          padding: 24px; 
          position: relative; overflow: hidden; 
          box-shadow: var(--shadow-premium); 
          transition: transform 0.3s; 
          border: 1px solid transparent; 
        }
        .stat-card-premium:hover { transform: translateY(-4px); border-color: var(--border-light); }
        .stat-card-inner { position: relative; z-index: 2; display: flex; align-items: center; gap: 16px; }
        .stat-icon-circle { 
          width: 48px; height: 48px; 
          border-radius: 14px; 
          display: flex; align-items: center; justify-content: center; 
          font-size: 20px; font-weight: 800; 
        }
        
        .stat-card-premium.passed .stat-icon-circle { background: #ecfdf5; color: var(--success); }
        .stat-card-premium.failed .stat-icon-circle { background: #fef2f2; color: var(--danger); }
        .stat-card-premium.skipped .stat-icon-circle { background: #f8fafc; color: var(--text-muted); }
        .stat-card-premium.percent .stat-icon-circle { background: var(--brand-light); color: var(--brand); }
        
        .stat-content { display: flex; flex-direction: column; }
        .stat-val { font-size: 28px; font-weight: 850; line-height: 1; }
        .stat-lab { font-size: 13px; color: var(--text-muted); font-weight: 600; margin-top: 4px; }
        
        .stat-card-pattern { 
          position: absolute; right: -20px; bottom: -20px; 
          width: 100px; height: 100px; 
          background: currentColor; opacity: 0.03; 
          border-radius: 50%; 
        }

        /* ===== Test Section & Grid ===== */
        .count-badge { 
          padding: 4px 12px; 
          background: var(--brand-light); 
          border-radius: 20px; 
          font-size: 13px; font-weight: 800; 
          color: var(--brand); 
          border: 1px solid transparent; 
        }
        .section-top-info { display: flex; align-items: center; gap: 24px; margin-bottom: 24px; }
        .section-top-info h2 { font-size: 20px; font-weight: 850; color: #334155; }
        
        .search-container { position: relative; flex: 1; max-width: 400px; }
        .search-icon { position: absolute; left: 16px; top: 11px; color: var(--text-muted); font-size: 14px; }
        .search-container input { 
          width: 100%; padding: 10px 16px 10px 44px; 
          border-radius: 12px; 
          border: 1px solid var(--border-light); 
          background: #fff; 
          font-size: 13px; 
          outline: none;
          transition: all 0.2s;
        }
        .search-container input:focus { border-color: var(--brand); box-shadow: 0 0 0 3px var(--side-active); }

        .type-filter-btn {
          padding: 8px 16px; border-radius: 100px;
          border: 1px solid var(--border-light);
          background: #fff; color: var(--text-muted);
          font-size: 13px; font-weight: 700; cursor: pointer;
          transition: all 0.2s;
        }
        .type-filter-btn:hover { background: #f8fafc; color: var(--text-deep); }
        .type-filter-btn.active { background: var(--side-bg); color: #fff; border-color: var(--side-bg); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

        .test-card { 
          background: #fff; 
          border-radius: 20px; 
          margin-bottom: 20px; 
          border: 1px solid var(--border-light); 
          overflow: hidden; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.02); 
        }
        .test-card-header { padding: 24px; cursor: pointer; background: #fff; transition: background 0.2s; }
        .test-card-header:hover { background: #fafbfc; }
        
        .test-info-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .module-chip { 
          font-size: 11px; font-weight: 800; 
          background: var(--brand-light); color: var(--brand); 
          padding: 4px 10px; border-radius: 6px; 
          text-transform: uppercase; 
        }
        .type-tag { font-size: 10px; font-weight: 800; padding: 4px 8px; border-radius: 6px; letter-spacing: 0.5px; }
        .ui-tag { background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd; }
        .api-tag { background: #f3e8ff; color: #7e22ce; border: 1px solid #e9d5ff; }
        .setup-tag { background: #6366f1; color: #fff; padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 10px; letter-spacing: 0.5px; }
        
        /* Tag Badges */
        .tag-badge { 
          font-size: 10px; font-weight: 800; padding: 3px 10px; 
          border-radius: 100px; letter-spacing: 0.3px; 
          display: inline-flex; align-items: center; justify-content: center;
          text-transform: capitalize;
        }
        .tag-p0 { background: #fee2e2; color: #ef4444; border: 1px solid #fecaca; }
        .tag-p1 { background: #ffedd5; color: #f97316; border: 1px solid #fed7aa; }
        .tag-smoke { background: #dcfce7; color: #22c55e; border: 1px solid #bbf7d0; }
        .tag-regression { background: #e0e7ff; color: #6366f1; border: 1px solid #c7d2fe; }
        .tag-default { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }

        .duration-chip { font-size: 11px; font-weight: 700; color: #94a3b8; }
        
        .test-title-row { display: flex; align-items: center; gap: 16px; }
        .status-blob { 
          width: 24px; height: 24px; border-radius: 8px; 
          display: flex; align-items: center; justify-content: center; 
          color: #fff; font-size: 14px; font-weight: 900; flex-shrink: 0; 
        }
        .test-title-text { font-size: 18px; font-weight: 800; flex: 1; color: #1e293b; }
        .expand-all-hint { 
          font-size: 11px; color: var(--text-muted); font-weight: 600; 
          border: 1px dashed #e2e8f0; padding: 2px 8px; border-radius: 4px; 
        }

        /* ===== Steps Timeline ===== */
        .test-card-body { border-top: 1px solid var(--border-light); padding: 0 24px 24px 24px; }
        .steps-timeline { padding-top: 24px; }
        .step-node { border-left: 2px solid #e2e8f0; padding-left: 24px; position: relative; margin-bottom: 16px; }
        .step-node:last-child { margin-bottom: 0; }
        
        .step-line-head { 
          display: flex; align-items: center; gap: 12px; 
          cursor: pointer; padding: 12px 18px; 
          border-radius: 12px; background: #fafbfc; 
          transition: all 0.2s; 
        }
        .step-line-head:hover { background: #f1f5f9; }
        
        .arrow-icon { 
          font-size: 18px; color: #94a3b8; 
          width: 14px; height: 14px; 
          display: flex; align-items: center; 
          transition: transform 0.2s; 
        }
        .step-marker { 
          width: 22px; height: 22px; 
          background: #fff; border: 2px solid #e2e8f0; border-radius: 6px; 
          display: flex; align-items: center; justify-content: center; 
          font-size: 11px; font-weight: 800; color: #64748b; 
        }
        .step-label { font-size: 14px; font-weight: 700; flex: 1; }
        .step-time { font-size: 12px; color: var(--text-muted); font-weight: 600; }
        .step-status-v { 
          font-size: 10px; font-weight: 800; 
          color: var(--success); background: #ecfdf5; 
          padding: 2px 6px; border-radius: 4px; 
        }

        .step-expansion { max-height: 0; overflow: hidden; transition: all 0.4s ease-out; }
        .step-node.is-expanded .step-expansion { max-height: 2000px; padding-top: 16px; }
        
        .evidence-box { 
          padding: 20px; background: #fff; border-radius: 16px; 
          border: 1px solid var(--border-light); 
          box-shadow: 0 4px 20px rgba(0,0,0,0.03); 
        }
        .evidence-header { 
          font-size: 12px; font-weight: 800; color: var(--text-muted); 
          margin-bottom: 12px; display: flex; align-items: center; gap: 6px; 
        }
        .evidence-header::before { 
          content: ''; width: 4px; height: 12px; 
          background: var(--brand); border-radius: 2px; 
        }
        .evidence-box img { 
          width: 100%; border-radius: 8px; display: block; 
          border: 1px solid #f1f5f9; 
        }

        .error-panel { 
          margin-top: 12px; 
          background: #fff; border-radius: 12px; 
          border: 1px solid #f1f5f9;
        }
        .error-panel summary {
          padding: 12px 20px;
          font-size: 12px;
          font-weight: 700;
          color: #94a3b8;
          cursor: pointer;
          user-select: none;
          list-style: none;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .error-panel summary::before {
          content: '▶';
          font-size: 10px;
          transition: transform 0.2s;
        }
        .error-panel[open] summary::before {
          transform: rotate(90deg);
        }
        .error-panel pre { 
          font-size: 11px; font-family: 'JetBrains Mono', 'Menlo', monospace; 
          line-height: 1.6; color: #64748b; white-space: pre-wrap;
          background: #f8fafc; padding: 20px; border-radius: 0 0 12px 12px;
          border-top: 1px solid #f1f5f9;
        }

        .semantic-summary {
          background: #fff;
          padding: 32px;
          border-radius: var(--radius-lg);
          margin-bottom: 24px;
          border: 1px solid #fee2e2;
          box-shadow: 0 10px 40px -10px rgba(239, 68, 68, 0.08);
          position: relative;
          overflow: hidden;
        }
        .semantic-summary::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 6px; background: var(--danger);
        }
        
        .semantic-success {
          background: #fff;
          padding: 24px;
          border-radius: var(--radius-lg);
          margin-top: 16px;
          border: 1px solid #d1fae5;
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.04);
          position: relative;
          overflow: hidden;
        }
        .semantic-success::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 6px; background: var(--success);
        }
        
        .summary-title { font-size: 16px; font-weight: 900; color: #b91c1c; margin-bottom: 24px; display: flex; align-items: center; gap: 10px; }
        .success-title { font-size: 14px; font-weight: 900; color: #065f46; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        
        .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .success-grid { display: flex; flex-direction: column; gap: 12px; }
        
        .summary-item { display: flex; flex-direction: column; gap: 8px; }
        .success-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; background: #f0fdf4; border-radius: 8px; border: 1px solid #dcfce7; }
        
        .summary-label { font-size: 10px; font-weight: 800; color: #ef4444; text-transform: uppercase; letter-spacing: 1px; }
        .success-marker { color: var(--success); font-weight: 900; font-size: 14px; margin-top: 2px; }
        
        .summary-value { font-size: 15px; font-weight: 700; color: #1e293b; line-height: 1.6; }
        .success-value { font-size: 13px; font-weight: 700; color: #1e293b; line-height: 1.5; }
        
        .suggestion-box {
          margin-top: 24px; padding: 16px 20px; background: rgba(239, 68, 68, 0.03); 
          border-radius: 10px; font-size: 13px; color: #b91c1c; font-weight: 600;
          display: flex; align-items: center; gap: 10px;
        }

        .empty-state { display: flex; flex-direction: column; align-items: center; padding: 120px 0; color: var(--text-muted); }
        .empty-illustration { font-size: 64px; margin-bottom: 16px; opacity: 0.4; }

        /* ===== Test Conclusion Cards ===== */
        .test-conclusion-wrapper { margin-top: 36px; padding-top: 24px; border-top: 1px solid var(--border-light); }
        .tc-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .tc-icon-circle { 
          width: 32px; height: 32px; border-radius: 8px; 
          background: #ecfdf5; color: #10b981; 
          display: flex; align-items: center; justify-content: center; 
        }
        .tc-header h3 { font-size: 18px; font-weight: 850; color: #0f172a; margin: 0; }
        .tc-summary { font-size: 15px; color: #334155; margin-bottom: 24px; font-weight: 600; line-height: 1.6; }

        .tc-cards-grid { 
          display: flex; gap: 24px; margin-bottom: 24px; 
        }
        .tc-card {
          flex: 1; padding: 24px; border-radius: var(--radius-lg);
          background: #f8fafc; border: 1px solid #f1f5f9;
          display: flex; align-items: flex-start; gap: 16px;
        }
        .tc-card-icon {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .tc-card-icon.ui { background: #eff6ff; color: #3b82f6; }
        .tc-card-icon.api { background: #fffbeb; color: #f59e0b; }

        .tc-card-content { display: flex; flex-direction: column; gap: 6px; }
        .tc-card-title { font-size: 16px; font-weight: 850; color: #0f172a; }
        .tc-card-desc { font-size: 13px; color: #475569; line-height: 1.6; }

        .tc-footer { 
          display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700;
          padding-top: 20px; border-top: 1px dashed #e2e8f0; margin-bottom: 8px;
        }
        .tc-footer.success { color: #059669; }
        .tc-footer.danger { color: #dc2626; }

        @media print { 
          .sidebar, .sidebar-toggle, .top-bar { display: none; } 
          .main-content { overflow: visible; } 
          .scroll-area { overflow: visible !important; height: auto; padding: 0; } 
          body { background: #fff; } 
          .premium-header-card, .stat-card-premium, .test-card { 
            border: 1px solid #eee; box-shadow: none; break-inside: avoid; 
          } 
        }
        .api-response-box { margin-top: 12px; background: #0f172a; border-radius: 12px; border: 1px solid #1e293b; }
        .api-response-box .evidence-header { color: #94a3b8; padding: 12px 16px; margin-bottom: 0; border-bottom: 1px solid #1e293b; }
        .response-console { padding: 16px; background: #0f172a; overflow-x: auto; }
        .response-console pre { margin: 0; font-family: 'JetBrains Mono', 'Menlo', monospace; font-size: 13px; line-height: 1.6; color: #38bdf8; }
        .response-console code { color: #38bdf8; }
    </style>`;
}
