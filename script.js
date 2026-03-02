const firebaseConfig = {
    apiKey: "AIzaSyCaf5Zwl4mIxdReLgdoUCkzi1KWEMzeEpA",
    authDomain: "schoolmonitor-b1c8b.firebaseapp.com",
    databaseURL: "https://schoolmonitor-b1c8b-default-rtdb.firebaseio.com/",
    projectId: "schoolmonitor-b1c8b",
    storageBucket: "schoolmonitor-b1c8b.firebasestorage.app",
    messagingSenderId: "838073337449",
    appId: "1:838073337449:web:33a254365be4761b0544f8"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();
const adminCode = "21.08";

const studentsData = {
    "id1": { name: "Астахову Євгенію", code: "26.12" }, "id2": { name: "Бабенко Поліну", code: "01.04" },
    "id3": { name: "Водолазьку Соломію", code: "13.02" }, "id4": { name: "Гомонюк Софію", code: "15.02" },
    "id5": { name: "Деміденко Аріну", code: "01.10" }, "id6": { name: "Єлісеєва Дмитра", code: "11.12" },
    "id7": { name: "Іванця Тімура", code: "05.07" }, "id8": { name: "Калантаєву Анастасію", code: "12.02" },
    "id9": { name: "Лисих Ліану", code: "31.01" }, "id10": { name: "Оковитого Максима", code: "17.06" },
    "id11": { name: "Павлова Тимура", code: "26.04" }, "id12": { name: "Радченко Владиславу", code: "25.04" },
    "id13": { name: "Скабардіна Мілославу", code: "15.01" }, "id14": { name: "Удовіка Макара", code: "27.10" },
    "id15": { name: "Філатову Ульяну", code: "24.06" }, "id16": { name: "Холматову Віолетту", code: "04.03" },
    "id17": { name: "Шаповала Тимура", code: "04.05" }
};

// ОНОВЛЕНА СТРУКТУРА
const schoolStructure = {
    "Літературне читання": ["Діагностична робота", "Вірш", "Творча робота"],
    "Українська мова": ["Діагностична робота", "Свій вид діяльності"],
    "Математика": ["Діагностична робота", "Самостійна робота"],
    "Я досліджую світ": ["Діагностична робота", "Свій вид діяльності"],
    "Дизайн і технології": ["Творча робота"]
};

async function checkData() {
    const id = document.getElementById('studentSelect').value;
    const inputCode = document.getElementById('passCode').value.trim();
    const resultBlock = document.getElementById('result');
    const errorMsg = document.getElementById('errorMsg');

    const isTeacher = (inputCode === adminCode);
    const isParent = (id && studentsData[id] && studentsData[id].code === inputCode);

    if (id && (isTeacher || isParent)) {
        errorMsg.classList.add('hidden');
        resultBlock.classList.remove('hidden');
        document.getElementById('studentNameDisplay').innerText = studentsData[id].name;
        
        const snapshot = await database.ref('students/' + id).once('value');
        renderData(id, snapshot.val() || {}, isTeacher);
        
        if (isTeacher) {
            database.ref('students/' + id).on('value', (snap) => renderData(id, snap.val() || {}, true));
        }
    } else {
        resultBlock.classList.add('hidden');
        errorMsg.classList.remove('hidden');
    }
}

function renderData(id, data, canEdit) {
    const listDisplay = document.getElementById('debtList');
    const updateDisplay = document.getElementById('updateTime');
    listDisplay.innerHTML = "";
    updateDisplay.innerText = data.lastChange ? "Останні зміни: " + data.lastChange : "Оновлень ще не було";

    for (let subject in schoolStructure) {
        let subBlock = document.createElement('div');
        subBlock.className = "subject-group";
        subBlock.innerHTML = `<h4>${subject}</h4>`;

        schoolStructure[subject].forEach(category => {
            let catBlock = document.createElement('div');
            catBlock.innerHTML = `<p class="category-title">${category}</p>`;

            const records = (data[subject] && data[subject][category]) ? data[subject][category] : {};
            
            for (let key in records) {
                const val = records[key].val || "";
                if (!canEdit && val.trim() === "") continue;

                let row = document.createElement('div');
                row.className = 'multi-row';

                let dateCell = document.createElement('span');
                dateCell.className = "date-cell";
                dateCell.contentEditable = canEdit;
                dateCell.innerText = records[key].date || "ДД.ММ";
                if (canEdit) dateCell.onblur = () => updateCloud(id, subject, category, key, 'date', dateCell.innerText);

                let status = document.createElement('div');
                status.className = 'subject-status';
                status.contentEditable = canEdit;
                status.innerText = val || "немає ✅";
                status.classList.add(val ? "status-debt" : "status-ok");

                if (canEdit) {
                    status.onblur = () => {
                        let text = status.innerText.replace("немає ✅", "").trim();
                        updateCloud(id, subject, category, key, 'val', text);
                    };
                    let delBtn = document.createElement('button');
                    delBtn.innerHTML = "×"; delBtn.className = "del-btn";
                    delBtn.onclick = () => database.ref(`students/${id}/${subject}/${category}/${key}`).remove();
                    row.appendChild(delBtn);
                }

                row.appendChild(dateCell);
                row.appendChild(status);
                catBlock.appendChild(row);
            }

            if (canEdit) {
                let addBtn = document.createElement('button');
                addBtn.innerText = "+ додати роботу"; addBtn.className = "add-btn";
                addBtn.onclick = () => {
                    let newKey = database.ref().child('students').push().key;
                    database.ref(`students/${id}/${subject}/${category}/${newKey}`).set({ 
                        date: new Date().toLocaleDateString('uk-UA').slice(0, 5), 
                        val: "" 
                    });
                };
                catBlock.appendChild(addBtn);
            }
            subBlock.appendChild(catBlock);
        }
        listDisplay.appendChild(subBlock);
    }
}

function updateCloud(id, sub, cat, key, field, value) {
    database.ref(`students/${id}/${sub}/${cat}/${key}/${field}`).set(value);
    database.ref(`students/${id}/lastChange`).set(new Date().toLocaleDateString('uk-UA'));
}