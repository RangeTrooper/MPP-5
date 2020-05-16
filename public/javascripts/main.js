function getGuitars(){
    $.ajax({
        url: "/api",
        contentType:"application/json",
        type: "POST",
        data: JSON.stringify({
            query:`{guitars {guitar_id, guitar_name,amount_in_stock, img_src}}`,
        }),
        success: function (result) {
            let rows = "";
            $.each(result.data.guitars, function (index, guitar) {
                rows += row(guitar);
            });
            $("table tbody").append(rows);
            $('#guitarTable').DataTable();
            $('.dataTables_length').addClass('bs-select');
            render(window.location.hash);
        }
    })
}

getGuitars();

function render(hashKey) {
    let pages = document.querySelectorAll(".page");
    for (let i = 0; i < pages.length; ++i) {
        pages[i].style.display = 'none';
    }

    let navLis = document.querySelectorAll(".navLis");
    for (let i = 0; i < navLis.length; ++i) {
        navLis[i].classList.remove("active");
    }

    switch (hashKey) {
        case "":
            pages[0].style.display = 'block';
            document.getElementById("li_main").classList.add("active");
            break;
        case "#main":
            pages[0].style.display = 'block';
            document.getElementById("li_main").classList.add("active");
            break;
        case "#register":
            pages[1].style.display = 'block';
            document.getElementById("li_register").classList.add("active");
            break;
        case "#login":
            pages[2].style.display = 'block';
            document.getElementById("li_login").classList.add("active");
            break;
        case "#adding":
            pages[3].style.display = 'block';
            document.getElementById("li_adding").classList.add("active");
            break;
        default:
            pages[0].style.display = 'block';
            document.getElementById("li_main").classList.add("active");
    }
}

let row = function (guitar) {
    let img_src;
    if (guitar.img_src === 'NULL' || guitar.img_src == null)
        img_src = "no_image_found.png";
    else
        img_src = guitar.img_src;
    return "<tr data-rowid='" + guitar.guitar_id + "'><td><img style='max-width: 170px' class='img-thumbnail' src='" + img_src + "' ></td><td>" + guitar.guitar_id + "</td>" +
        "<td>" + guitar.guitar_name + "</td> <td>" + guitar.amount_in_stock + "</td>" +
        "<td><a class='editLink btn btn-info' data-id='" + guitar.guitar_id + "'>Изменить</a> | " +
        "<a class='removeLink btn btn-danger' data-id='" + guitar.guitar_id + "'>Удалить</a></td></tr>";
};

$("#reset").click(function (e) {

    e.preventDefault();
    reset();
});

function reset() {
    $("form").reset();
}

function deleteGuitar(guitar_id){
    let str = `{deleteGuitar (guitar_id: ${guitar_id})}`;
    $.ajax({
        url: "/api",
        contentType:"application/json",
        type: "POST",
        data: JSON.stringify({
            query:`mutation {deleteGuitar (guitar_id: ${guitar_id})}`,
        }),
        success: function (result) {
            $("tr[data-rowid='" + result.data.deleteGuitar + "']").remove();
        }
    })
}

$("body").on("click", ".removeLink", function () {
    var id = $(this).data("id");
    deleteGuitar(id);
});

window.onhashchange = function () {
    render(window.location.hash);
};