document.getElementById('addButton').addEventListener('click', function() {
  let taskText = document.getElementById('taskInput').value;
  if (taskText === '') return;
  let newLi = document.createElement('li');
  newLi.textContent = taskText;
  document.getElementById('taskList').appendChild(newLi);
  document.getElementById('taskInput').value = '';
});
