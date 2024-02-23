import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Button } from '@chakra-ui/react';
import presentationService from '../../services/presentation';

export const PresentationPage = () => {
  const { id } = useParams();
  const [presentationInfo, setPresentationInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    presentationService.get(id).then((info) => setPresentationInfo(info));
  }, [id]);

  const removePresentationOnClick = (presentationId) => {
    presentationService.remove(presentationId);
    navigate("/home")
  }
  return (
    <Container>
      {presentationInfo && (
        <div>
          <p>Name: {presentationInfo.name}</p>
          <p>Cues: {presentationInfo.cues}</p>
        </div>
      )}
      <Button onClick={() => removePresentationOnClick(id)}>
        Delete
      </Button>
    </Container>
  );
};

export default PresentationPage;
