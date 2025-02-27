import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProjectCard.css';

function ProjectCard({ id, name, category, description, projectDDL, status, fundingGoal, amountRaised, onClick, activePage, creator }) {
  const [milestones, setMilestones] = useState([]);
  const [currentUser, setCurrentUser] = useState('');

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setCurrentUser(accounts[0]?.toLowerCase() || '');
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (status.toLowerCase() === 'funded') {
      fetchMilestones(id);
    }
  }, [id, status]);

  const fetchMilestones = async (projectId) => {
    try {
      const response = await axios.get('/api/milestones', {
        params: { projectId }
      });
      const projectMilestones = response.data.filter(milestone => milestone.projectId === projectId);
      setMilestones(projectMilestones);
    } catch (error) {
      console.error('Error fetching milestones:', error);
    }
  };

  const daysUntilDeadline = (new Date(projectDDL) - new Date()) / (1000 * 60 * 60 * 24);
  const isDeadlineSoon = daysUntilDeadline <= 6;

  const formatDescription = (text) => {
    const maxLength = 100; // Adjusted max length for description
    if (text.length > maxLength) {
      return text.substring(0, maxLength - 3) + '...';
    }
    return text;
  };

  const formatTitle = (text) => {
    const maxLength = 30; // Adjusted max length for title
    if (text.length > maxLength) {
      return text.substring(0, maxLength - 3) + '...';
    }
    return text;
  };

  const displayedDescription = formatDescription(description);
  const displayedTitle = formatTitle(name);

  // Convert fundingGoal to Ether and ensure amountRaised is in Ether
  const fundingGoalInEther = (fundingGoal / 10 ** 18).toString();
  const amountRaisedInEther = parseFloat(amountRaised).toString();

  const fundingProgress = (parseFloat(amountRaisedInEther) / parseFloat(fundingGoalInEther)) * 100;

  // Determine card color based on project status or creator
  const isCreator = creator?.toLowerCase() === currentUser; // Check if the current user is the creator
  const cardColorClass = status.toLowerCase() === 'deleted' ? 'gray' : (isCreator ? 'orange' : '');

  return (
    <div className={`project-card ${cardColorClass}`} onClick={onClick}>
      <div className="card-header">
        <h3 className="project-name">{displayedTitle}</h3>
        <p className="project-id"><strong>ID:</strong> {id}</p>
        <p className="project-category"><strong>Category:</strong> {category}</p>
      </div>
      <div className="card-body">
        <p className="project-description">
          <strong>Description:</strong> {displayedDescription}
        </p>
        <p className="project-ddl">
          <strong>Deadline: </strong>
          <span className={`deadline-date ${isDeadlineSoon ? 'soon' : ''}`}>
            {new Date(projectDDL).toLocaleDateString()}
          </span>
        </p>
      </div>
      <div className="card-footer">
        {status.toLowerCase() === 'active' ? (
          <div className="status-section">
            <p className="project-status">Crowdfunding Project - Raised: {amountRaisedInEther} / {fundingGoalInEther} ETH</p>
            <div className="progress-bar">
              <div className="progress" style={{ width: `${fundingProgress}%` }}></div>
            </div>
          </div>
        ) : null}

        {status.toLowerCase() === 'funded' && milestones.length > 0 ? (
          <div className="milestone-section">
            <p className="project-status">Milestone Progress - {milestones.filter(m => m.milestonestatus === 'approved').length} of {milestones.length} approved</p>
            <div className="milestone-progress-container">
              {milestones.map((milestone, index) => {
                const milestoneStatus = milestone.milestonestatus;
                const isApproved = milestoneStatus === 'approved';
                const isPending = milestoneStatus === 'pending';
                return (
                  <div
                    key={`${id}-${milestone.milestoneId}`} // Use milestoneId as key
                    className={`milestone-progress ${isApproved ? 'approved' : isPending ? 'pending' : 'upcoming'}`}
                  ></div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default ProjectCard;
