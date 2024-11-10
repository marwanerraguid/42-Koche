document.addEventListener("DOMContentLoaded", () => {
	const newProjectButton = document.getElementById("newProjectButton");
	const projectModal = document.getElementById("projectModal");
	const closeModalButton = document.getElementById("closeModalButton");
	const projectForm = document.getElementById("projectForm");

	const userLevelElem = document.getElementById("userLevel");
	const userXP = document.getElementById("userXP");
	const xpBar = document.getElementById("xpBar");
	const xpFill = document.getElementById("xpFill");
	const projectsTableBody = document.getElementById("projectsTableBody");
	const projectGrid = document.getElementById("projectGrid");
	const currentProjectElem = document.getElementById("currentProject");

	let projects = JSON.parse(localStorage.getItem("projects")) || [];
	let userXPValue = 0;
	let userLevelValue = 0;
	let editingProject = null;
	function loadProjects() {
		projects.sort((a, b) => {
			if (a.status === "Completed" && b.status !== "Completed") return 1;
			if (a.status !== "Completed" && b.status === "Completed") return -1;
			return a.xp - b.xp;
		});
		decrementDaysLeft();
		projectsTableBody.innerHTML = "";
		projectGrid.innerHTML = "";
		projects.forEach((project, index) => {
			const row = document.createElement("tr");
			if (project.status === "Completed") {
				row.classList.add("completed");
			} else {
				row.classList.remove("completed");
			}
			row.innerHTML = `
                <td>${project.title}</td>
                <td>${project.technologies.join(", ")}</td>
                <td>${project.xp}</td>
                <td>${project.daysLeft} jour(s)</td>
                <td>
                    <select class="status-select" data-index="${index}">
                        <option value="To Do" ${
							project.status === "To Do" ? "selected" : ""
						}>À faire</option>
                        <option value="In Progress" ${
							project.status === "In Progress" ? "selected" : ""
						}>En cours</option>
                        <option value="Completed" ${
							project.status === "Completed" ? "selected" : ""
						}>Terminé</option>
                    </select>
                </td>
                <td>
                    <button class="edit-btn btn" data-index="${index}">Modifier</button>
                    <button class="delete-btn btn" data-index="${index}">Supprimer</button>
                </td>
            `;
			projectsTableBody.appendChild(row);

			// Add to project grid
			const projectCard = document.createElement("div");
			projectCard.classList.add("project-card");
			projectCard.innerHTML = `
                <h3>${project.title}</h3>
                <p>${project.technologies.join(", ")}</p>
                <p>${project.daysLeft} jour(s)</p>
            `;
			projectGrid.appendChild(projectCard);
		});

		// Update last in-progress project
		const lastInProgress = projects.find(
			(project) => project.status === "In Progress"
		);
		if (lastInProgress) {
			currentProjectElem.innerText = `${lastInProgress.title} - ${lastInProgress.daysLeft} jour(s) restant(s)`;
		} else {
			currentProjectElem.innerText = "Aucun projet en cours";
		}

		// Update XP and level
		updateXP();
	}
	function decrementDaysLeft() {
		const currentDate = new Date().toDateString();

		projects.forEach((project) => {
			if (project.status === "In Progress" && project.daysLeft > 0) {
				const lastUpdated = new Date(
					project.lastUpdated || currentDate
				);
				const daysDifference = Math.floor(
					(new Date(currentDate) - lastUpdated) /
						(1000 * 60 * 60 * 24)
				);

				if (daysDifference > 0) {
					project.daysLeft = Math.max(
						0,
						project.daysLeft - daysDifference
					);
					project.lastUpdated = currentDate;
				}
			}
		});

		saveProjects();
	}
	function saveProjects() {
		localStorage.setItem("projects", JSON.stringify(projects));
	}

	function updateXP() {
		let totalXP = 0;

		// Calcul de l'XP total en comptant seulement les projets terminés
		projects.forEach((project) => {
			if (project.status === "Completed") {
				totalXP += project.xp;
			}
		});

		// Met à jour l'XP de l'utilisateur
		userXPValue = totalXP;
		userXP.innerText = `${userXPValue}/100 XP`; // Affiche l'XP

		// Calcule le pourcentage de XP pour la barre de niveau
		const xpPercentage = Math.min(100, userXPValue % 100); // On garde le reste pour ne pas dépasser 100%

		// Applique la largeur de la barre de progression en fonction de l'XP
		xpFill.style.width = `${xpPercentage}%`;

		// Mise à jour du niveau
		userLevelValue = Math.floor(userXPValue / 100); // Le niveau est calculé à chaque fois qu'on atteint 100 XP
		userLevelElem.innerText = `${userLevelValue}`; // Affiche le niveau
	}
	// Appel de la fonction pour mettre à jour l'XP et le niveau initialement
	updateXP();

	// Open modal to create or edit a project
	newProjectButton.addEventListener("click", () => {
		editingProject = null;
		document.getElementById("modalTitle").innerText =
			"Créer un nouveau projet";
		document.getElementById("projectTitle").value = "";
		document.getElementById("technologies").value = "";
		document.getElementById("xp").value = "";
		document.getElementById("daysLeft").value = "";
		document.getElementById("status").value = "To Do";
		projectModal.style.display = "block";
	});

	// Close modal
	closeModalButton.addEventListener("click", () => {
		projectModal.style.display = "none";
	});

	// Form submit to create or edit project
	projectForm.addEventListener("submit", (e) => {
		e.preventDefault();

		const title = document.getElementById("projectTitle").value;
		const technologies = document
			.getElementById("technologies")
			.value.split(",");
		const xp = parseInt(document.getElementById("xp").value);
		const daysLeft = parseInt(document.getElementById("daysLeft").value);
		const status = document.getElementById("status").value;

		const newProject = {
			title,
			technologies,
			xp,
			daysLeft,
			status,
		};

		if (editingProject !== null) {
			projects[editingProject] = newProject;
		} else {
			projects.push(newProject);
		}

		saveProjects();
		loadProjects();
		projectModal.style.display = "none";
	});

	// Handle project actions (Edit, Delete)
	projectsTableBody.addEventListener("click", (e) => {
		const index = e.target.getAttribute("data-index");
		if (e.target.classList.contains("edit-btn")) {
			editingProject = index;
			document.getElementById("modalTitle").innerText =
				"Éditer le projet";
			document.getElementById("projectTitle").value =
				projects[index].title;
			document.getElementById("technologies").value =
				projects[index].technologies.join(", ");
			document.getElementById("xp").value = projects[index].xp;
			document.getElementById("daysLeft").value =
				projects[index].daysLeft;
			document.getElementById("status").value = projects[index].status;
			projectModal.style.display = "block";
		}

		if (e.target.classList.contains("delete-btn")) {
			projects.splice(index, 1);
			saveProjects();
			loadProjects();
		}
	});

	// Handle status change
	projectsTableBody.addEventListener("change", (e) => {
		if (e.target.classList.contains("status-select")) {
			const index = e.target.getAttribute("data-index");
			const newStatus = e.target.value;
			const previousStatus = projects[index].status;

			// Mettre à jour le statut du projet
			projects[index].status = newStatus;
			saveProjects();

			// Recalculer l'XP seulement si le statut a changé de manière significative
			if (
				(previousStatus === "Completed" && newStatus !== "Completed") ||
				(previousStatus !== "Completed" && newStatus === "Completed")
			) {
				updateXP(); // Met à jour l'XP et le niveau en fonction du nouveau statut
			}

			loadProjects(); // Recharge la liste des projets
		}
	});

	// Load initial data
	loadProjects();
});
