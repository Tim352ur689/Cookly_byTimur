from flask import Flask, render_template, jsonify, request
import json
import os
from datetime import datetime

app = Flask(__name__)

# Файлы для хранения данных
RECIPES_FILE = 'recipes.json'
FAVORITES_FILE = 'data/favorites.json'
USER_RECIPES_FILE = 'data/user_recipes.json'
USER_INGREDIENTS_FILE = 'data/user_ingredients.json'

# Создаем папку data если ее нет
os.makedirs('data', exist_ok=True)

def load_json_file(filename, default_data=None):
    """Загружает данные из JSON файла"""
    if default_data is None:
        default_data = []
    
    try:
        if os.path.exists(filename):
            with open(filename, 'r', encoding='utf-8') as f:
                return json.load(f)
        return default_data
    except (json.JSONDecodeError, FileNotFoundError):
        return default_data

def save_json_file(filename, data):
    """Сохраняет данные в JSON файл"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@app.route('/')
def index():
    """Главная страница"""
    return render_template('index.html')

@app.route('/api/recipes')
def get_recipes():
    """Получить все рецепты"""
    recipes = load_json_file(RECIPES_FILE, [])
    return jsonify(recipes)

@app.route('/api/favorites')
def get_favorites():
    """Получить избранные рецепты"""
    favorites = load_json_file(FAVORITES_FILE, [])
    return jsonify(favorites)

@app.route('/api/favorites', methods=['POST'])
def toggle_favorite():
    """Добавить/удалить рецепт из избранного"""
    data = request.json
    recipe_id = data.get('recipeId')
    
    if not recipe_id:
        return jsonify({'error': 'No recipeId provided'}), 400
    
    favorites = load_json_file(FAVORITES_FILE, [])
    
    if recipe_id in favorites:
        favorites.remove(recipe_id)
        action = 'removed'
    else:
        favorites.append(recipe_id)
        action = 'added'
    
    save_json_file(FAVORITES_FILE, favorites)
    
    return jsonify({
        'success': True,
        'action': action,
        'favorites': favorites
    })

@app.route('/api/user-recipes')
def get_user_recipes():
    """Получить пользовательские рецепты"""
    user_recipes = load_json_file(USER_RECIPES_FILE, [])
    return jsonify(user_recipes)

@app.route('/api/user-recipes', methods=['POST'])
def save_user_recipe():
    """Сохранить пользовательский рецепт"""
    data = request.json
    
    # Проверка обязательных полей
    required_fields = ['title', 'time', 'difficulty', 'calories', 'servings']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    user_recipes = load_json_file(USER_RECIPES_FILE, [])
    
    # Генерация ID для нового рецепта
    if 'id' in data:
        # Обновление существующего рецепта
        recipe_id = data['id']
        for i, recipe in enumerate(user_recipes):
            if recipe['id'] == recipe_id:
                user_recipes[i] = data
                break
    else:
        # Создание нового рецепта
        new_id = max([r['id'] for r in user_recipes], default=99) + 1
        data['id'] = new_id
        data['isUserRecipe'] = True
        data['isFavorite'] = False
        user_recipes.append(data)
    
    save_json_file(USER_RECIPES_FILE, user_recipes)
    
    return jsonify({
        'success': True,
        'recipe': data
    })

@app.route('/api/user-recipes/<int:recipe_id>', methods=['DELETE'])
def delete_user_recipe(recipe_id):
    """Удалить пользовательский рецепт"""
    user_recipes = load_json_file(USER_RECIPES_FILE, [])
    
    # Удаляем рецепт
    user_recipes = [r for r in user_recipes if r['id'] != recipe_id]
    save_json_file(USER_RECIPES_FILE, user_recipes)
    
    # Удаляем из избранного
    favorites = load_json_file(FAVORITES_FILE, [])
    if recipe_id in favorites:
        favorites.remove(recipe_id)
        save_json_file(FAVORITES_FILE, favorites)
    
    return jsonify({
        'success': True,
        'deletedId': recipe_id
    })

@app.route('/api/user-ingredients')
def get_user_ingredients():
    """Получить пользовательские ингредиенты"""
    user_ingredients = load_json_file(USER_INGREDIENTS_FILE, [])
    return jsonify(user_ingredients)

@app.route('/api/user-ingredients', methods=['POST'])
def save_user_ingredient():
    """Сохранить пользовательский ингредиент"""
    data = request.json
    ingredient = data.get('ingredient', '').strip()
    
    if not ingredient:
        return jsonify({'error': 'No ingredient provided'}), 400
    
    user_ingredients = load_json_file(USER_INGREDIENTS_FILE, [])
    
    # Добавляем только если еще нет
    if ingredient not in user_ingredients:
        user_ingredients.append(ingredient)
        user_ingredients.sort()
        save_json_file(USER_INGREDIENTS_FILE, user_ingredients)
    
    return jsonify({
        'success': True,
        'ingredients': user_ingredients
    })

@app.route('/api/common-ingredients')
def get_common_ingredients():
    """Получить общие ингредиенты"""
    common_ingredients = [
        "Мука", "Сахар", "Соль", "Перец", "Оливковое масло", "Подсолнечное масло",
        "Яйца", "Молоко", "Сливки", "Сметана", "Масло сливочное", "Сыр",
        "Пармезан", "Моцарелла", "Чеснок", "Лук репчатый", "Лук зеленый",
        "Морковь", "Картофель", "Помидоры", "Огурцы", "Перец болгарский",
        "Капуста белокочанная", "Капуста цветная", "Брокколи", "Шпинат",
        "Салат листовой", "Петрушка", "Укроп", "Базилик", "Кинза",
        "Куриное филе", "Говядина", "Свинина", "Бекон", "Ветчина",
        "Колбаса", "Сосиски", "Рыба белая", "Лосось", "Креветки",
        "Кальмары", "Мидии", "Рис", "Гречка", "Макароны", "Спагетти",
        "Лапша", "Хлеб", "Сухари", "Орехи грецкие", "Миндаль", "Кешью",
        "Изюм", "Курага", "Чернослив", "Мед", "Варенье", "Шоколад",
        "Какао", "Ванилин", "Корица", "Имбирь", "Куркума", "Паприка",
        "Лавровый лист", "Уксус", "Соевый соус", "Горчица", "Майонез",
        "Кетчуп", "Томатная паста", "Лимон", "Апельсин", "Яблоки",
        "Бананы", "Клубника", "Малина", "Черника", "Авокадо", "Оливки",
        "Каперсы", "Тыква", "Кабачки", "Баклажаны", "Грибы", "Фасоль",
        "Горох", "Чечевица", "Кукуруза", "Горошек зеленый"
    ]
    return jsonify(common_ingredients)

@app.route('/api/all-ingredients')
def get_all_ingredients():
    """Получить все ингредиенты (общие + пользовательские)"""
    common = [
        "Мука", "Сахар", "Соль", "Перец", "Оливковое масло", "Подсолнечное масло",
        "Яйца", "Молоко", "Сливки", "Сметана", "Масло сливочное", "Сыр",
        "Пармезан", "Моцарелла", "Чеснок", "Лук репчатый", "Лук зеленый",
        "Морковь", "Картофель", "Помидоры", "Огурцы", "Перец болгарский",
        "Капуста белокочанная", "Капуста цветная", "Брокколи", "Шпинат",
        "Салат листовой", "Петрушка", "Укроп", "Базилик", "Кинза",
        "Куриное филе", "Говядина", "Свинина", "Бекон", "Ветчина",
        "Колбаса", "Сосиски", "Рыба белая", "Лосось", "Креветки",
        "Кальмары", "Мидии", "Рис", "Гречка", "Макароны", "Спагетти",
        "Лапша", "Хлеб", "Сухари", "Орехи грецкие", "Миндаль", "Кешью",
        "Изюм", "Курага", "Чернослив", "Мед", "Варенье", "Шоколад",
        "Какао", "Ванилин", "Корица", "Имбирь", "Куркума", "Паприка",
        "Лавровый лист", "Уксус", "Соевый соус", "Горчица", "Майонез",
        "Кетчуп", "Томатная паста", "Лимон", "Апельсин", "Яблоки",
        "Бананы", "Клубника", "Малина", "Черника", "Авокадо", "Оливки",
        "Каперсы", "Тыква", "Кабачки", "Баклажаны", "Грибы", "Фасоль",
        "Горох", "Чечевица", "Кукуруза", "Горошек зеленый"
    ]
    
    user_ingredients = load_json_file(USER_INGREDIENTS_FILE, [])
    
    # Объединяем и убираем дубликаты
    all_ingredients = list(set(common + user_ingredients))
    all_ingredients.sort()
    
    return jsonify(all_ingredients)

@app.route('/api/all-recipes')
def get_all_recipes():
    """Получить все рецепты (основные + пользовательские)"""
    main_recipes = load_json_file(RECIPES_FILE, [])
    user_recipes = load_json_file(USER_RECIPES_FILE, [])
    
    all_recipes = main_recipes + user_recipes
    return jsonify(all_recipes)

if __name__ == '__main__':
    # Создаем начальные файлы если их нет
    if not os.path.exists(RECIPES_FILE):
        # Здесь будет код для создания начальных рецептов
        pass
    
    app.run(debug=True, port=5000)