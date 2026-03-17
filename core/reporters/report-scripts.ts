/**
 * report-scripts.ts
 * Premium Report 前端交互脚本 — 侧边栏控制、模块筛选、搜索、步骤展开
 */

export function getReportScripts(): string {
  return `<script>
        let currentModule = 'all';
        let searchQuery = '';

        function toggleSidebar() {
          const layout = document.getElementById('app-layout');
          layout.classList.toggle('sidebar-collapsed');
        }

        function filterByModule(moduleName, element) {
            currentModule = moduleName;
            document.querySelectorAll('.nav-item').forEach(function(item) { 
              item.classList.remove('active'); 
            });
            element.classList.add('active');
            
            document.getElementById('current-module-title').textContent = 
              moduleName === 'all' ? '全部执行详情' : moduleName + ' 模块详情';
            applyFilters();
        }

        function toggleNavGroup(headerEl) {
          var group = headerEl.closest('.nav-group');
          group.classList.toggle('is-collapsed');
        }

        function handleSearch() {
            searchQuery = document.getElementById('case-search').value.toLowerCase();
            applyFilters();
        }

        function openShareModal() {
            const modal = document.getElementById('share-modal');
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.classList.add('active');
            }, 10);
        }

        function closeShareModal() {
            const modal = document.getElementById('share-modal');
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }

        let currentType = 'all';

        function filterByType(type, element) {
            currentType = type;
            document.querySelectorAll('.type-filter-btn').forEach(function(item) {
                item.classList.remove('active');
            });
            element.classList.add('active');
            applyFilters();
        }

        function applyFilters() {
            var container = document.getElementById('test-container');
            var tests = container.querySelectorAll('.test-card');
            var visibleCount = 0;

            tests.forEach(function(test) {
                var moduleMatch = currentModule === 'all' || test.getAttribute('data-module') === currentModule;
                var typeMatch = currentType === 'all' || test.getAttribute('data-type') === currentType;
                var searchMatch = test.getAttribute('data-title').toLowerCase().includes(searchQuery);

                if (moduleMatch && typeMatch && searchMatch) {
                    test.style.display = 'block';
                    visibleCount++;
                } else {
                    test.style.display = 'none';
                }
            });

            document.getElementById('visible-count').textContent = visibleCount;
            document.getElementById('no-results').style.display = visibleCount === 0 ? 'flex' : 'none';
        }

        function filterModules() {
          var val = document.getElementById('module-filter').value.toLowerCase();
          document.querySelectorAll('.nav-item').forEach(function(item) {
            var name = item.getAttribute('data-module-name');
            if (!name) return;
            item.style.display = name.toLowerCase().includes(val) ? 'flex' : 'none';
          });
        }

        function toggleStep(element) {
            var stepItem = element.closest('.step-node');
            stepItem.classList.toggle('is-expanded');
            var icon = element.querySelector('.arrow-icon');
            if (icon) {
              icon.style.transform = stepItem.classList.contains('is-expanded') ? 'rotate(90deg)' : 'rotate(0deg)';
            }
        }
        
        function toggleAllSteps(element) {
          var testCard = element.closest('.test-card');
          var steps = testCard.querySelectorAll('.step-node');
          var isSomeExpanded = Array.from(steps).some(function(s) { 
            return s.classList.contains('is-expanded'); 
          });
          
          steps.forEach(function(step) {
            var arrow = step.querySelector('.arrow-icon');
            if (isSomeExpanded) {
              step.classList.remove('is-expanded');
              if (arrow) arrow.style.transform = 'rotate(0deg)';
            } else {
              step.classList.add('is-expanded');
              if (arrow) arrow.style.transform = 'rotate(90deg)';
            }
          });
        }
    </script>`;
}
