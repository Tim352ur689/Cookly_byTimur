// ========== API ФУНКЦИИ ==========

// Функция для отправки запросов к API
async function apiRequest(endpoint, method = 'GET', data = null) {
    const url = `/api${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Ошибка запроса');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        showNotification(`Ошибка: ${error.message}`, 'exclamation-triangle');
        throw error;
    }
}

// Загружаем все рецепты
async function loadAllRecipes() {
    try {
        const response = await apiRequest('/all-recipes');
        return response;
    } catch (error) {
        return [];
    }
}

// Загружаем избранные рецепты
async function loadFavorites() {
    try {
        const response = await apiRequest('/favorites');
        return response;
    } catch (error) {
        return [];
    }
}

// Добавляем/удаляем из избранного
async function toggleFavorite(recipeId) {
    try {
        const response = await apiRequest('/favorites', 'POST', { recipeId });
        return response;
    } catch (error) {
        return null;
    }
}

// Загружаем пользовательские рецепты
async function loadUserRecipes() {
    try {
        const response = await apiRequest('/user-recipes');
        return response;
    } catch (error) {
        return [];
    }
}

// Сохраняем пользовательский рецепт
async function saveUserRecipe(recipeData) {
    try {
        const response = await apiRequest('/user-recipes', 'POST', recipeData);
        return response;
    } catch (error) {
        return null;
    }
}

// Удаляем пользовательский рецепт
async function deleteUserRecipe(recipeId) {
    try {
        const response = await apiRequest(`/user-recipes/${recipeId}`, 'DELETE');
        return response;
    } catch (error) {
        return null;
    }
}

// Загружаем все ингредиенты
async function loadAllIngredients() {
    try {
        const response = await apiRequest('/all-ingredients');
        return response;
    } catch (error) {
        return [];
    }
}

// Сохраняем пользовательский ингредиент
async function saveUserIngredient(ingredient) {
    try {
        const response = await apiRequest('/user-ingredients', 'POST', { ingredient });
        return response;
    } catch (error) {
        return null;
    }
}

// ========== ФУНКЦИИ ДЛЯ ОТОБРАЖЕНИЯ ==========

// Функция для отображения рецептов
async function renderRecipes(recipesArray, containerId, showFavoriteBtn = true, showUserBadge = false) {
    const container = document.getElementById(containerId);
    if (!container) return false;
    
    container.innerHTML = '';
    
    if (recipesArray.length === 0) {
        return false;
    }
    
    const favorites = await loadFavorites();
    
    recipesArray.forEach(recipe => {
        const recipeCard = document.createElement('div');
        recipeCard.className = 'recipe-card';
        recipeCard.dataset.id = recipe.id;
        
        const isFavorite = favorites.includes(recipe.id);
        const favoriteClass = isFavorite ? 'active' : '';
        
        recipeCard.innerHTML = `
            <div class="recipe-img-container">
                <img src="${recipe.image}" alt="${recipe.title}" class="recipe-img" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'">
                <div class="recipe-overlay"></div>
                ${showFavoriteBtn ? `<button class="favorite-btn ${favoriteClass}" onclick="toggleFavoriteHandler(${recipe.id}, event)">
                    <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                </button>` : ''}
                ${showUserBadge && recipe.isUserRecipe ? '<div class="user-recipe-badge">Мой рецепт</div>' : ''}
            </div>
            <div class="recipe-content">
                <div class="recipe-title">${recipe.title}</div>
                <div class="recipe-info">
                    <span><i class="far fa-clock"></i> ${recipe.time}</span>
                    <span><i class="fas fa-signal"></i> ${recipe.difficulty}</span>
                    <span><i class="fas fa-fire"></i> ${recipe.calories}</span>
                </div>
            </div>
        `;
        
        recipeCard.addEventListener('click', (e) => {
            if (!e.target.closest('.favorite-btn')) {
                openRecipeModal(recipe);
            }
        });
        
        container.appendChild(recipeCard);
    });
    
    return true;
}

// Функция для отображения всех рецептов
async function renderAllRecipes() {
    const allRecipes = await loadAllRecipes();
    const hasRecipes = await renderRecipes(allRecipes, 'recipes-list');
    
    if (!hasRecipes) {
        document.getElementById('recipes-list').innerHTML = `
            <div style="text-align: center; padding: 50px 20px; color: var(--text-light);">
                <i class="fas fa-utensils" style="font-size: 4rem; margin-bottom: 20px;"></i>
                <h3>Пока нет рецептов</h3>
            </div>
        `;
    }
}

// Функция для отображения избранных рецептов
async function renderFavorites() {
    const favorites = await loadFavorites();
    const allRecipes = await loadAllRecipes();
    const favoriteRecipes = allRecipes.filter(recipe => favorites.includes(recipe.id));
    
    const container = document.getElementById('favorites-list');
    const emptyMessage = document.getElementById('empty-favorites');
    
    if (favoriteRecipes.length > 0) {
        await renderRecipes(favoriteRecipes, 'favorites-list', true);
        emptyMessage.style.display = 'none';
    } else {
        container.innerHTML = '';
        emptyMessage.style.display = 'block';
    }
}

// Функция для отображения моих рецептов
async function renderMyRecipes() {
    const userRecipes = await loadUserRecipes();
    
    const container = document.getElementById('my-recipes-list');
    const emptyMessage = document.getElementById('empty-my-recipes');
    
    if (userRecipes.length > 0) {
        await renderRecipes(userRecipes, 'my-recipes-list', true, true);
        emptyMessage.style.display = 'none';
    } else {
        container.innerHTML = '';
        emptyMessage.style.display = 'block';
    }
}

// ========== ФУНКЦИИ ДЛЯ ИЗБРАННОГО ==========

async function toggleFavoriteHandler(recipeId, event) {
    if (event) event.stopPropagation();
    
    try {
        const result = await toggleFavorite(recipeId);
        
        if (result) {
            if (result.action === 'added') {
                showNotification('Рецепт добавлен в избранное!', 'heart');
            } else {
                showNotification('Рецепт удален из избранного', 'heart-broken');
            }
            
            // Обновляем кнопки
            document.querySelectorAll(`.favorite-btn[onclick*="${recipeId}"]`).forEach(btn => {
                const isFavorite = result.favorites.includes(recipeId);
                if (isFavorite) {
                    btn.classList.add('active');
                    btn.innerHTML = '<i class="fas fa-heart"></i>';
                } else {
                    btn.classList.remove('active');
                    btn.innerHTML = '<i class="far fa-heart"></i>';
                }
            });
            
            // Обновляем вкладку избранного
            renderFavorites();
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
    }
}

// ========== ФУНКЦИИ ДЛЯ ФОРМЫ СОЗДАНИЯ РЕЦЕПТА ==========

// Добавляем ингредиент в форму
async function addIngredient(ingredientName = '', amount = '', isCustom = false) {
    const container = document.getElementById('ingredients-container');
    const message = document.getElementById('no-ingredients-message');
    
    // Скрываем сообщение
    if (message) message.style.display = 'none';
    
    const row = document.createElement('div');
    row.className = 'ingredient-row';
    
    // Получаем все ингредиенты для выпадающего списка
    const allIngredients = await loadAllIngredients();
    let options = '<option value="">Выберите ингредиент...</option>';
    
    allIngredients.forEach(ingredient => {
        const selected = ingredient === ingredientName ? 'selected' : '';
        options += `<option value="${ingredient}" ${selected}>${ingredient}</option>`;
    });
    
    row.innerHTML = `
        <div class="ingredient-name-container">
            <select class="form-select ingredient-select" ${isCustom ? 'style="display:none"' : ''}>
                ${options}
            </select>
            <input type="text" class="form-input ingredient-name-input" 
                   placeholder="Введите свой ингредиент" 
                   value="${isCustom ? ingredientName : ''}"
                   ${isCustom ? '' : 'style="display:none"'}>
            <button type="button" class="custom-ingredient-toggle" onclick="toggleIngredientMode(this)">
                <i class="fas ${isCustom ? 'fa-list' : 'fa-edit'}"></i>
            </button>
        </div>
        <input type="text" class="form-input ingredient-amount-input" placeholder="Количество" value="${amount}" required>
        <button type="button" class="remove-ingredient" onclick="removeIngredient(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(row);
    
    // Фокусируемся на поле количества
    setTimeout(() => {
        const amountInput = row.querySelector('.ingredient-amount-input');
        if (amountInput) amountInput.focus();
    }, 100);
}

// Удаляем ингредиент из формы
function removeIngredient(button) {
    const row = button.closest('.ingredient-row');
    if (row) {
        row.remove();
        
        // Показываем сообщение, если не осталось ингредиентов
        const container = document.getElementById('ingredients-container');
        const message = document.getElementById('no-ingredients-message');
        if (container.children.length === 0 && message) {
            message.style.display = 'block';
        }
    }
}

// Переключаем режим ввода ингредиента
async function toggleIngredientMode(button) {
    const row = button.closest('.ingredient-row');
    const select = row.querySelector('.ingredient-select');
    const input = row.querySelector('.ingredient-name-input');
    const icon = button.querySelector('i');
    
    if (select.style.display === 'none') {
        // Переключаемся на выбор из списка
        select.style.display = 'block';
        input.style.display = 'none';
        icon.className = 'fas fa-edit';
        select.focus();
    } else {
        // Переключаемся на собственный ввод
        select.style.display = 'none';
        input.style.display = 'block';
        icon.className = 'fas fa-list';
        input.focus();
    }
}

// Добавляем шаг в форму
function addStep(stepText = '') {
    const container = document.getElementById('steps-container');
    const rowCount = container.children.length;
    
    const row = document.createElement('div');
    row.className = 'step-row';
    row.innerHTML = `
        <div class="step-number">${rowCount + 1}</div>
        <textarea class="form-input step-input" placeholder="Опишите шаг приготовления" required>${stepText}</textarea>
        <button type="button" class="remove-ingredient" onclick="removeStep(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(row);
    
    // Фокусируемся на текстовом поле
    setTimeout(() => {
        const textarea = row.querySelector('.step-input');
        if (textarea) textarea.focus();
    }, 100);
}

// Удаляем шаг из формы
function removeStep(button) {
    const row = button.closest('.step-row');
    if (row && document.getElementById('steps-container').children.length > 1) {
        row.remove();
        
        // Обновляем номера шагов
        document.querySelectorAll('.step-row .step-number').forEach((number, index) => {
            number.textContent = index + 1;
        });
    }
}

// Отменяем создание рецепта
function cancelCreate() {
    const form = document.getElementById('recipe-form');
    form.reset();
    form.removeAttribute('data-edit-id');
    
    // Очищаем ингредиенты
    const ingredientsContainer = document.getElementById('ingredients-container');
    ingredientsContainer.innerHTML = '';
    
    // Показываем сообщение
    document.getElementById('no-ingredients-message').style.display = 'block';
    
    // Очищаем шаги и добавляем один пустой
    const stepsContainer = document.getElementById('steps-container');
    stepsContainer.innerHTML = '';
    addStep();
    
    // Восстанавливаем текст кнопки
    const saveBtn = form.querySelector('.save-btn');
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Сохранить рецепт';
    
    // Переключаемся на все рецепты
    switchTab('recipes');
}

// Открываем форму создания рецепта
function openCreateRecipeForm() {
    // Сбрасываем форму
    cancelCreate();
    
    // Показываем вкладку создания
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById('create').classList.add('active');
    
    // Убираем активность с навигационных вкладок
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Прокручиваем к верху
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========== ФУНКЦИИ ДЛЯ СОХРАНЕНИЯ РЕЦЕПТА ==========

// Редактируем рецепт
async function editRecipe(recipeId) {
    const userRecipes = await loadUserRecipes();
    const recipe = userRecipes.find(r => r.id === recipeId);
    
    if (!recipe) return;
    
    // Закрываем модальное окно
    closeRecipeModal();
    
    // Открываем форму создания
    openCreateRecipeForm();
    
    // Заполняем форму
    document.getElementById('recipe-title').value = recipe.title;
    document.getElementById('recipe-image').value = recipe.image;
    document.getElementById('recipe-time').value = recipe.time;
    document.getElementById('recipe-difficulty').value = recipe.difficulty;
    document.getElementById('recipe-calories').value = recipe.calories;
    document.getElementById('recipe-servings').value = recipe.servings;
    
    // Заполняем ингредиенты
    const ingredientsContainer = document.getElementById('ingredients-container');
    ingredientsContainer.innerHTML = '';
    
    const allIngredients = await loadAllIngredients();
    recipe.ingredients.forEach(async (ingredient) => {
        const isCustom = !allIngredients.includes(ingredient.name);
        addIngredient(ingredient.name, ingredient.amount, isCustom);
    });
    
    // Заполняем шаги
    const stepsContainer = document.getElementById('steps-container');
    stepsContainer.innerHTML = '';
    
    recipe.instructions.forEach(step => {
        addStep(step);
    });
    
    // Сохраняем ID для обновления
    const form = document.getElementById('recipe-form');
    form.dataset.editId = recipeId;
    
    // Меняем текст кнопки
    const saveBtn = form.querySelector('.save-btn');
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Обновить рецепт';
}

// Удаляем рецепт
async function deleteRecipeHandler(recipeId) {
    if (!confirm('Вы уверены, что хотите удалить этот рецепт?')) {
        return;
    }
    
    try {
        const result = await deleteUserRecipe(recipeId);
        
        if (result && result.success) {
            closeRecipeModal();
            await renderMyRecipes();
            await renderAllRecipes();
            await renderFavorites();
            showNotification('Рецепт удален', 'trash');
        }
    } catch (error) {
        console.error('Error deleting recipe:', error);
    }
}

// ========== ФУНКЦИИ ДЛЯ МОДАЛЬНОГО ОКНА ==========

// Открываем модальное окно с рецептом
async function openRecipeModal(recipe) {
    const modal = document.getElementById('recipe-modal');
    const modalContent = modal.querySelector('.modal-content');
    
    const favorites = await loadFavorites();
    const isFavorite = favorites.includes(recipe.id);
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <img src="${recipe.image}" alt="${recipe.title}" class="modal-img" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'">
            <button class="close-modal" id="close-modal">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <h2 class="modal-title">${recipe.title}</h2>
            
            <div class="modal-meta">
                <div class="meta-item">
                    <div class="meta-icon">
                        <i class="far fa-clock"></i>
                    </div>
                    <div class="meta-value">${recipe.time}</div>
                    <div class="meta-label">Время</div>
                </div>
                <div class="meta-item">
                    <div class="meta-icon">
                        <i class="fas fa-signal"></i>
                    </div>
                    <div class="meta-value">${recipe.difficulty}</div>
                    <div class="meta-label">Сложность</div>
                </div>
                <div class="meta-item">
                    <div class="meta-icon">
                        <i class="fas fa-fire"></i>
                    </div>
                    <div class="meta-value">${recipe.calories}</div>
                    <div class="meta-label">Калории</div>
                </div>
                <div class="meta-item">
                    <div class="meta-icon">
                        <i class="fas fa-utensils"></i>
                    </div>
                    <div class="meta-value">${recipe.servings}</div>
                    <div class="meta-label">Порции</div>
                </div>
            </div>
            
            <div class="modal-section">
                <h3 class="section-heading">
                    <i class="fas fa-shopping-basket"></i>
                    <span>Ингредиенты</span>
                </h3>
                <ul class="ingredients-list">
                    ${recipe.ingredients.map(ing => `
                        <li>
                            <span class="ingredient-name">${ing.name}</span>
                            <span class="ingredient-amount">${ing.amount}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
            
            <div class="modal-section">
                <h3 class="section-heading">
                    <i class="fas fa-list-ol"></i>
                    <span>Приготовление</span>
                </h3>
                <ol class="instructions-list">
                    ${recipe.instructions.map((step, index) => `
                        <li>${step}</li>
                    `).join('')}
                </ol>
            </div>
            
            <div class="modal-actions">
                <button class="modal-favorite-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavoriteHandler(${recipe.id})">
                    <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i> ${isFavorite ? 'В избранном' : 'В избранное'}
                </button>
                ${recipe.isUserRecipe ? `
                    <button class="modal-edit-btn" onclick="editRecipe(${recipe.id})">
                        <i class="fas fa-edit"></i> Редактировать
                    </button>
                    <button class="modal-delete-btn" onclick="deleteRecipeHandler(${recipe.id})">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Добавляем обработчик закрытия
    const closeBtn = document.getElementById('close-modal');
    closeBtn.addEventListener('click', closeRecipeModal);
    
    // Закрытие по клику вне окна
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeRecipeModal();
        }
    });
    
    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeRecipeModal();
        }
    });
}

// Закрываем модальное окно
function closeRecipeModal() {
    const modal = document.getElementById('recipe-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

// Переключаем вкладки
function switchTab(tabId) {
    // Обновляем навигацию
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    const targetTab = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
    if (targetTab) targetTab.classList.add('active');
    
    // Показываем соответствующую вкладку
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    const targetContent = document.getElementById(tabId);
    if (targetContent) targetContent.classList.add('active');
    
    // Обновляем содержимое вкладок
    if (tabId === 'recipes') {
        renderAllRecipes();
    } else if (tabId === 'favorites') {
        renderFavorites();
    } else if (tabId === 'my-recipes') {
        renderMyRecipes();
    }
}

// Показываем уведомление
function showNotification(message, icon = 'check-circle') {
    // Удаляем старые уведомления
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Удаляем через 3.5 секунды
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.5s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 500);
    }, 3500);
}

// Имитируем поиск по фото
async function simulatePhotoSearch() {
    const searchResults = document.getElementById('search-results');
    searchResults.innerHTML = `
        <div class="section-title">
            <i class="fas fa-search"></i>
            <span>Результаты поиска</span>
        </div>
        <div style="text-align: center; padding: 70px 20px;">
            <div class="loading" style="width: 50px; height: 50px; margin: 0 auto 25px; border-width: 4px;"></div>
            <p style="margin-top: 15px; color: var(--text-dark); font-size: 1.1rem; font-weight: 700;">Cookly анализирует ваше фото...</p>
            <p style="color: var(--text-light); font-size: 0.95rem; margin-top: 10px; max-width: 300px; margin-left: auto; margin-right: auto;">Определяем продукты и ищем подходящие теплые рецепты</p>
        </div>
    `;
    
    searchResults.scrollIntoView({ behavior: 'smooth' });
    
    setTimeout(async () => {
        const allRecipes = await loadAllRecipes();
        const shuffled = [...allRecipes].sort(() => Math.random() - 0.5);
        const results = shuffled.slice(0, 4);
        
        searchResults.innerHTML = `
            <div class="section-title">
                <i class="fas fa-search"></i>
                <span>Найденные рецепты</span>
            </div>
            <p style="color: var(--dark-orange); margin-bottom: 25px; font-weight: 700; text-align: center; font-size: 1.1rem; background: rgba(255, 228, 214, 0.5); padding: 15px; border-radius: 12px;">
                <i class="fas fa-check-circle" style="color: var(--accent-coral); margin-right: 8px;"></i> 
                По вашим продуктам найдено ${results.length} рецептов
            </p>
            <div class="recipes-container" id="search-recipes"></div>
        `;
        
        await renderRecipes(results, 'search-recipes');
        showNotification(`Найдено ${results.length} рецептов по вашим продуктам!`, 'check-circle');
    }, 2500);
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем все отображения
    renderAllRecipes();
    renderFavorites();
    renderMyRecipes();
    
    // Добавляем первый ингредиент и шаг
    addIngredient();
    addStep();
    
    // Навигация
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Кнопка создания рецепта
    document.getElementById('add-recipe-btn').addEventListener('click', openCreateRecipeForm);
    
    // Поиск по фото
    document.getElementById('upload-area').addEventListener('click', () => {
        document.getElementById('file-input').click();
    });
    
    document.getElementById('file-input').addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            simulatePhotoSearch();
        }
    });
    
    document.getElementById('camera-button').addEventListener('click', simulatePhotoSearch);
    
    // Обработка формы создания рецепта
    document.getElementById('recipe-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Показываем индикатор загрузки
        const saveBtn = this.querySelector('.save-btn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<div class="loading" style="width: 20px; height: 20px; margin: 0;"></div>';
        saveBtn.disabled = true;
        
        try {
            // Собираем данные
            const title = document.getElementById('recipe-title').value.trim();
            const image = document.getElementById('recipe-image').value.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80';
            const time = document.getElementById('recipe-time').value.trim();
            const difficulty = document.getElementById('recipe-difficulty').value;
            const calories = document.getElementById('recipe-calories').value.trim();
            const servings = document.getElementById('recipe-servings').value.trim();
            
            // Проверяем обязательные поля
            if (!title || !time || !difficulty || !calories || !servings) {
                showNotification('Заполните все обязательные поля', 'exclamation-triangle');
                return;
            }
            
            // Собираем ингредиенты
            const ingredients = [];
            const ingredientPromises = [];
            
            document.querySelectorAll('.ingredient-row').forEach(row => {
                const select = row.querySelector('.ingredient-select');
                const input = row.querySelector('.ingredient-name-input');
                const amount = row.querySelector('.ingredient-amount-input').value.trim();
                
                let name = '';
                if (select.style.display !== 'none') {
                    name = select.value.trim();
                } else {
                    name = input.value.trim();
                }
                
                if (name && amount) {
                    ingredients.push({ name, amount });
                    
                    // Добавляем пользовательский ингредиент в базу
                    if (select.style.display === 'none') {
                        ingredientPromises.push(saveUserIngredient(name));
                    }
                }
            });
            
            // Ждем сохранения всех ингредиентов
            await Promise.all(ingredientPromises);
            
            // Проверяем ингредиенты
            if (ingredients.length === 0) {
                showNotification('Добавьте хотя бы один ингредиент', 'exclamation-triangle');
                return;
            }
            
            // Собираем шаги
            const instructions = [];
            document.querySelectorAll('.step-row').forEach(row => {
                const step = row.querySelector('.step-input').value.trim();
                if (step) {
                    instructions.push(step);
                }
            });
            
            // Проверяем шаги
            if (instructions.length === 0) {
                showNotification('Добавьте хотя бы один шаг приготовления', 'exclamation-triangle');
                return;
            }
            
            const recipeData = {
                title,
                image,
                time,
                difficulty,
                calories,
                servings,
                ingredients,
                instructions
            };
            
            // Добавляем ID если редактируем
            const editId = this.dataset.editId;
            if (editId) {
                recipeData.id = parseInt(editId);
            }
            
            // Сохраняем рецепт
            const result = await saveUserRecipe(recipeData);
            
            if (result && result.success) {
                if (editId) {
                    showNotification('Рецепт обновлен!', 'check-circle');
                } else {
                    showNotification('Новый рецепт создан!', 'check-circle');
                }
                
                // Обновляем все отображения
                await renderAllRecipes();
                await renderMyRecipes();
                
                // Переключаемся на мои рецепты
                switchTab('my-recipes');
                
                // Сбрасываем форму
                cancelCreate();
                
                // Открываем модальное окно с новым/обновленным рецептом
                if (!editId) {
                    setTimeout(() => {
                        openRecipeModal(result.recipe);
                    }, 500);
                }
            }
        } catch (error) {
            console.error('Error saving recipe:', error);
            showNotification('Ошибка при сохранении рецепта', 'exclamation-triangle');
        } finally {
            // Восстанавливаем кнопку
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    });
    
    // Приветственное уведомление
    setTimeout(() => {
        showNotification('Добро пожаловать в Cookly! Готовьте с любовью!', 'heart');
    }, 1000);
});