# Add to imports
from rag_integration import RAGIntegration

# Add to the main system initialization
def initialize_system(config_path=None):
    # Existing initialization code...
    
    # Initialize RAG integration
    rag_config_path = config.get("rag_config_path", "config/rag_config.json")
    kg_config_path = config.get("kg_config_path", "config/kg_config.json")
    rag_integration = RAGIntegration(rag_config_path, kg_config_path)
    
    # Integrate with pipeline components
    rag_integration.integrate_with_pipeline(
        document_inventory,
        document_preprocessor,
        response_generator
    )
    
    # Add to system components
    system_components["rag_integration"] = rag_integration
    
    # Rest of initialization...
    return system_components