# СПП, лабораторная работа №5

Веб-приложение с API, основанном на GraphQL

# Использованные технологии:

  - node.js, Express, graphql и graphql-express на сервере;
  - Bootstrap (v4.4.1), jQuery на клиенте;
  - БД MySQL (ClearDB удалённо).
  - JWT, bcrypt etc.

# Функционал:
- просмотр списка гитар в виде таблицы (список хранится в БД MySQL);
- возможность фильтрации, сортировки списка в таблице (с помощью библиотеки MDB);
- удаление/добавление информации о гитаре в список (БД MySQL).

1. Клиентская часть
    1. Сайт состоит из единственного HTML-файла index.html и файла со скриптами main.js. 
    2. SPA-стиль обеспечивается за счёт использования блочных элементов <div class="page">, в которые обёрнуты все страницы сайта. Пример:
         ```html
         <!---Страница добавления товара-->
         <div class="page" id=addingPage>
             <form name="input">
             ...
             </form>
         </div>
         <!--Страница входа в аккаунт-->
         <div class="page" id=loginPage>
         ...
         </div>
         ```
        Перемещение между страницами осуществляется за счёт изменения хеш-адреса. При его изменении вызывается функция
        ```js
        window.onhashchange = function () {
             render(window.location.hash);
        } 
        ```
        Функция render(hashkey) сперва скрывает все div'ы, а затем, исходя из значения хеша, изменяет свойство display у требуемого div
    3. Таблица реализована с помощью библиотек Material Design for Bootstrap. Обновление таблицы происходит после успешного выполнения запроса на сервер с целью удаления/добавления нового элемента в список при помощи метода append:
         ```js
         $("table tbody").append(row(guitar));
         ```
    4. Взаимодействие с сервером осуществляется с помощью ajax-запросов типа *"POST"*, в которых в качестве данных передаются graphql-запросы. Например, так выполняется запрос на получение списка гитар:
        ```js
        $.ajax({
            url: "/api",
            contentType:"application/json",
            type: "POST",
            data: JSON.stringify({
                query:`{guitars {guitar_id, guitar_name,amount_in_stock, img_src}}`,
            }),
        }    
        ```
        В случае успешного выполнения запроса обработка результата происходит в методе **success**:
        ```js
        $.each(result.data.guitars, function (index, guitar) {
                rows += row(guitar);
            });
        ```
2. Серверная часть
    1. Взаимодействие с клиентом построено по следующему принципу: на сервере описаны схемы запросов (параметры, возвращаемые значения) и определены **resolvers**, которые вызываются в случае поступления соответствующего запроса.
    В соответствии с канонами graphql, запросы, не приводящие к изменению данных на сервере, определены расширением типа **Query**, остальные (например, удаление гитары из БД) - как **Mutation**. Часть схемы:
        ```js
        type Mutation {
            deleteGuitar (guitar_id: Int!): Int
            addGuitar(guitar_id: Int!, guitar_name: String!, amount_in_stock: Int!, img_src: String): Guitar
        },
        ```
    2. Для взаимодействия с БД MySQL (ClearDB) используется библиотека mysql2. Данные с сервера на клиент посылаются в формате JSON. Пример получения списка всех гитар из БД:
        ```js
        connection.query("SELECT * FROM warehouse;",function(err, results, fields) {
            let guitars = JSON.stringify(results);
            let content=JSON.parse(guitars);
            return content;
        });
        ```
    3. Аутентификация осуществляется по следующему принципу:
        1. В БД выполняется запрос для получения пользователя с заданным логином. 
        2. Модуль bcrypt сравнивает полученный от клиента пароль с хешем, хранящимся в БД. В случае совпадения выполняются последующие пункты, иначе отправляется результат ***false***
        3. Создаётся JWT на основе логина и секретного ключа с временем жизни в 1 час
        4. Токен отсылкается на клиент внутри ***http-only cookie***.
    4. При попытке выполнить удаление объекта из списка на клиенте, на сервере первоначально будет проведена проверка пользовательского токена, полученного из cookie запроса:
         ```js
         deleteGuitar:  async (data) => {
        if ((token !== null) && verifyToken(token)){
            //запрос в БД для удаления
            //отправка сообщения в случае успешного удаления записи
            return true;
        }
        else
            ///сообщение о запрете доступа
            return false;
        });
        ```
        Для верификации используется стандартная функция библиотеки jsonwebtoken.
    5. При нажатии на кнопку "Выйти" на сервер отправляет запрос mutation {logout}, в результате которого время жизни http-only cookie устанавливается как прошедшая дата.
  
  # Демонстрация работы
  fierce-cliffs-51372.herokuapp.com
  
