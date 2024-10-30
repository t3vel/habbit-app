'use strict'

let habbits = [];
const HABBIT_KEY = 'HABBIT_KEY';
let globalActiveHabbitId;

// Сторінка
const page = {
    menu: document.querySelector('.menu__list'),
    header: {
        h1: document.querySelector('.h1'),
        progressPercent: document.querySelector('.progress__percent'),
        progressCoverBar: document.querySelector('.progress__cover-bar')
    },
    content: {
        daysContainer: document.getElementById('days'),
        nextDay: document.querySelector('.habbit__day'),
    },
    popup:{
        index: document.getElementById('add_popup'),
        iconField: document.querySelector('.popup__form input[name = "icon"]'),
    } 
}

function loadData(){
    const habbitsString = localStorage.getItem(HABBIT_KEY);
    const habbitArray = JSON.parse(habbitsString);
    if(Array.isArray(habbitArray)){
        habbits = habbitArray;
    }
}

function saveData(){
    localStorage.setItem(HABBIT_KEY, JSON.stringify(habbits));
}

function togglePopup(){
    if(page.popup.index.classList.contains('cover_hidden')){
        page.popup.index.classList.remove('cover_hidden')
    }
    else{
        page.popup.index.classList.add('cover_hidden')
    }
}

function resetForm(form, fields) {
    for (const field of fields) {
        if (form[field]) {  // Перевіряємо, чи поле існує у формі
            form[field].value = '';
        } else {
            console.warn(`Поле "${field}" не знайдено у формі`);
        }
    }
}


function validateAndGetFormData(form, fields){
    const formData = new FormData(form);
    const res = {};
    for(const field of fields){
        const fieldValue = formData.get(field).trim();  // обрізаємо пробіли на початку і в кінці
        form[field].classList.remove('error');
        if (!field) {  // Перевіряємо, чи коментар порожній
            form[field].classList.add('error');
            return; 
        }
        res[field] = fieldValue;
    }
    let isValid = true;
    for(const field of fields){
        if (!res[field]){
            isValid = false;
        }
    }
    if(!isValid){
        return;
    }
    return res;
}

// GPT
function loadInitialData() {
    fetch('data/demo.json')

        .then(response => response.json())
        .then(data => {
            habbits = data;
            saveData();
            rerender(habbits[0]?.id); // рендеримо перший елемент за замовчуванням
        })
        .catch(error => console.error('Помилка завантаження даних:', error));
}

function deleteHabit() {

    // Видаляємо звичку з масиву
    habbits = habbits.filter(habbit => habbit.id !== globalActiveHabbitId);

    // Видаляємо елемент з меню
    const menuItem = document.querySelector(`[menu-habbit-id="${globalActiveHabbitId}"]`);
    if (menuItem) {
        menuItem.remove();
    }

    // Оновлюємо локальне сховище
    saveData();

    // Перевіряємо наявність звичок і перерендерюємо
    if (habbits.length > 0) {
        rerender(habbits[0].id);
    } else {
        page.header.h1.innerText = '';
        page.content.daysContainer.innerHTML = '';
        page.header.progressPercent.innerText = '';
        page.header.progressCoverBar.setAttribute('style', 'width: 0%');
        page.content.nextDay.innerHTML = '';
    }
}




// Рендер

function rerenderMenu(activeHabbit){
    if (!activeHabbit){
        return;
    }
    for(const habbit of habbits){
        const excisted = document.querySelector(`[menu-habbit-id="${habbit.id}"]`);

        if(!excisted){
            // створити
            const element = document.createElement('button');
            element.setAttribute('menu-habbit-id', habbit.id);
            element.classList.add('menu__item');
            element.addEventListener('click', () => rerender(habbit.id));
            element.innerHTML = `<img src="/images/${habbit.icon}.svg" alt="${habbit.name}"></img>`;
            if (activeHabbit.id === habbit.id){
                element.classList.add('menu__item_active');
            }
            page.menu.appendChild(element);
            continue;
        }
        if (activeHabbit.id === habbit.id){
            excisted.classList.add('menu__item_active');
        } else{
            excisted.classList.remove('menu__item_active');
        }
    }
}

function rerenderHead(activeHabbit){
    if(!activeHabbit){
        return;
    }
    page.header.h1.innerText = activeHabbit.name;
    const progress = activeHabbit.days.length / activeHabbit.target > 1 
    ? 100
    : activeHabbit.days.length / activeHabbit.target * 100;

    page.header.progressPercent.innerText = progress.toFixed(0) + '%';
    page.header.progressCoverBar.setAttribute('style', `width: ${progress}%`)
}

function rerenderContent(activeHabbit) {
    page.content.daysContainer.innerHTML = '';
    for (const index in activeHabbit.days) {
        const element = document.createElement('div');
        element.classList.add('habbit');
        element.innerHTML = `
            <div class="habbit__day">
                День ${+index + 1}
            </div>
            <div class="habbit__comment">${activeHabbit.days[index].comment}</div>
            <button class="habbit__delete">
                <img src="/images/delete.svg" alt="Видалити день ${+index + 1}">
            </button>`;
        
        // Додаємо обробник події для кнопки видалення
        element.querySelector('.habbit__delete').addEventListener('click', () => deleteDay(index));

        page.content.daysContainer.appendChild(element);
    }
    page.content.nextDay.innerHTML = `День ${activeHabbit.days.length + 1}`;
}

function rerender(activeHabbitID){
    globalActiveHabbitId = activeHabbitID;
    const activeHabbit = habbits.find(habbit => habbit.id === activeHabbitID);
    document.location.replace(document.location.pathname + '#' + activeHabbitID);
    rerenderMenu(activeHabbit);
    rerenderHead(activeHabbit);
    rerenderContent(activeHabbit);

}

// Робота з днями
function addDays(event) {
    event.preventDefault();

    const data = validateAndGetFormData(event.target, ['comment']);
    if (!data){
        return
    }
    
    
    habbits = habbits.map(habbit => {
        if (habbit.id === globalActiveHabbitId) {
            return { 
                ...habbit,
                days: habbit.days.concat([{ comment: data.comment }])
            };
        }
        return habbit;
    });
    resetForm(event.target, ['comment']);
    rerender(globalActiveHabbitId);  // Перерендерюємо
    saveData();
}


function deleteDay(index){
    habbits = habbits.map(habbit => {
        if(habbit.id === globalActiveHabbitId){
            habbit.days.splice(index, 1);
            return {
                ...habbit,
                days: habbit.days
            };
        }
        return habbit;
    });
    rerender(globalActiveHabbitId);
    saveData();
}

//Робота зі звичками в попап вікні
function setIcon(contex, icon){
    page.popup.iconField.value = icon;
    const activeIcon = document.querySelector('.icon.icon_active');
    activeIcon.classList.remove('icon_active');
    contex.classList.add('icon_active');

}

function addHabbit(event){
    event.preventDefault();

    const data = validateAndGetFormData(event.target, ['name', 
        'icon', 'target'
    ]);
    if (!data){
        return;
    }
    const maxId = habbits.reduce((acc, habbit) => acc > habbit.id ? acc : habbit.id, 0);
    habbits.push({
        id: maxId + 1,
        name: data.name,
        target: data.target,
        icon: data.icon,
        days: []
    });
    resetForm(event.target, ['name', 'target']);
    saveData();
    togglePopup();
    rerender(maxId + 1);
}

(() => {
    loadData();
    if (habbits.length === 0) {
        loadInitialData();
    } else {
        const hashID = Number(document.location.hash.replace('#', ''))
        const urlHabbit = habbits.find(habbit => habbit.id === hashID);
        if (urlHabbit){
            rerender(urlHabbit.id)
        }else{
            rerender(habbits[0].id);
        }
    }
})();