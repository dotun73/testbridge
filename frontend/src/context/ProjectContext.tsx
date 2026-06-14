import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { projectService } from '../services/projectService'
import type { Project } from '../services/projectService'
import { authService } from '../services/authService'

interface ProjectContextType {
  projects: Project[]
  selectedProject: Project | null
  setSelectedProject: (project: Project) => void
  loading: boolean
  refreshProjects: () => Promise<void>
}

const ProjectContext = createContext<ProjectContextType | null>(null)

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProjectState] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProjects = async () => {
    if (!authService.isAuthenticated()) {
      setLoading(false)
      return
    }
    try {
      const data = await projectService.getProjects()
      setProjects(data)

      // Restore previously selected project or default to first
      const savedProjectId = localStorage.getItem('selectedProjectId')
      if (savedProjectId) {
        const saved = data.find(p => p.id === savedProjectId)
        if (saved) {
          setSelectedProjectState(saved)
          return
        }
      }
      if (data.length > 0) {
        setSelectedProjectState(data[0])
        localStorage.setItem('selectedProjectId', data[0].id)
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshProjects()
  }, [])

  const setSelectedProject = (project: Project) => {
    setSelectedProjectState(project)
    localStorage.setItem('selectedProjectId', project.id)
  }

  return (
    <ProjectContext.Provider value={{
      projects,
      selectedProject,
      setSelectedProject,
      loading,
      refreshProjects,
    }}>
      {children}
    </ProjectContext.Provider>
  )
}

export const useProject = () => {
  const context = useContext(ProjectContext)
  if (!context) throw new Error('useProject must be used within a ProjectProvider')
  return context
}