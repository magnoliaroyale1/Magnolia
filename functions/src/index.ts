import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const APP_NAME = 'Magnolia Royale';
const SUPPORT_EMAIL = 'contato@magnoliaroyale.com.br';

const emailTemplates = {
  approved: (clinicName: string, email: string, resetLink: string) => ({
    subject: `✅ ${clinicName} foi aprovada na ${APP_NAME}!`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #5C7A4B; padding: 40px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">${APP_NAME}</h1>
        </div>
        <div style="padding: 40px; background: #FAF8F5;">
          <h2 style="color: #5C7A4B;">Parabéns, ${clinicName}!</h2>
          <p>Sua clínica foi aprovada em nosso processo de validação.</p>
          <p>Seu e-mail de acesso é: <strong>${email}</strong></p>
          <p>Clique no botão abaixo para definir sua senha e acessar a plataforma:</p>
          <a href="${resetLink}" 
             style="background: #C9A84C; color: #fff; padding: 12px 32px; text-decoration: none; border-radius: 50px; display: inline-block; margin-top: 20px;">
            Definir Senha e Acessar
          </a>
          <p style="margin-top: 20px; font-size: 12px; color: #888;">
            Se o botão não funcionar, copie e cole o link no navegador: ${resetLink}
          </p>
        </div>
      </div>
    `
  }),
  rejected: (clinicName: string) => ({
    subject: `❌ Atualização sobre ${clinicName} na ${APP_NAME}`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #5C7A4B; padding: 40px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">${APP_NAME}</h1>
        </div>
        <div style="padding: 40px; background: #FAF8F5;">
          <h2 style="color: #5C7A4B;">Olá, ${clinicName}</h2>
          <p>Agradecemos o interesse, porém a empresa <strong>${clinicName}</strong> não foi aprovada em nosso processo de validação.</p>
          <p>Se tiver dúvidas, entre em contato conosco: ${SUPPORT_EMAIL}</p>
        </div>
      </div>
    `
  }),
  pendingInfo: (clinicName: string, feedback: string) => ({
    subject: `📋 ${clinicName} - Informações adicionais necessárias`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #5C7A4B; padding: 40px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">${APP_NAME}</h1>
        </div>
        <div style="padding: 40px; background: #FAF8F5;">
          <h2 style="color: #5C7A4B;">Precisamos de mais informações</h2>
          <p>Olá, <strong>${clinicName}</strong>!</p>
          <p>Para darmos continuidade ao processo de validação, precisamos dos seguintes ajustes:</p>
          <div style="background: #FFF3E0; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <p style="margin: 0;">${feedback}</p>
          </div>
          <p>Faça o login na plataforma e atualize os dados solicitados.</p>
          <a href="https://magnoliaroyale-b5afb.web.app/login" 
             style="background: #C9A84C; color: #fff; padding: 12px 32px; text-decoration: none; border-radius: 50px; display: inline-block; margin-top: 20px;">
            Acessar Plataforma
          </a>
        </div>
      </div>
    `
  })
};

export const createProfessionalUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado.');
  }

  const callerUid = context.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  const callerData = callerDoc.data();

  if (!callerData || (callerData.role !== 'clinic' && callerData.role !== 'admin')) {
    throw new functions.https.HttpsError('permission-denied', 'Apenas clínicas e administradores podem criar profissionais.');
  }

  const { email, password, name, clinicId } = data;

  // Validação rigorosa de entrada
  const errors: string[] = [];
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('email inválido');
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    errors.push('senha deve ter no mínimo 8 caracteres');
  }
  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.length > 100) {
    errors.push('nome deve ter entre 2 e 100 caracteres');
  }
  if (!clinicId || typeof clinicId !== 'string' || clinicId.length > 50) {
    errors.push('clinicId inválido');
  }
  if (errors.length > 0) {
    throw new functions.https.HttpsError('invalid-argument', `Campos inválidos: ${errors.join(', ')}.`);
  }

  if (callerData.role === 'clinic' && callerData.clinicId !== clinicId) {
    throw new functions.https.HttpsError('permission-denied', 'Você só pode criar profissionais para sua própria clínica.');
  }

  const userRecord = await admin.auth().createUser({
    email,
    password,
    displayName: name,
  });

  await admin.firestore().collection('users').doc(userRecord.uid).set({
    uid: userRecord.uid,
    email,
    displayName: name,
    role: 'professional',
    clinicId,
    emailVerified: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { uid: userRecord.uid };
});

export const onClinicApproved = functions.firestore
  .document('clinics/{clinicId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before?.status === 'pending' && after?.status === 'approved') {
      const usersSnap = await admin.firestore()
        .collection('users')
        .doc(context.params.clinicId)
        .get();
      const userData = usersSnap.data();
      if (!userData?.email) return;
      const resetLink = await admin.auth().generatePasswordResetLink(userData.email);
      const template = emailTemplates.approved(after.name, userData.email, resetLink);
      await sendEmail(userData.email, template.subject, template.html);
    }
  });

export const onClinicRejected = functions.firestore
  .document('clinics/{clinicId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before?.status === 'pending' && after?.status === 'rejected') {
      const usersSnap = await admin.firestore()
        .collection('users')
        .doc(context.params.clinicId)
        .get();
      const userData = usersSnap.data();
      if (!userData?.email) return;
      const template = emailTemplates.rejected(after.name);
      await sendEmail(userData.email, template.subject, template.html);
    }
  });

async function sendEmail(to: string, subject: string, html: string) {
  const mailRef = await admin.firestore().collection('mail').add({
    to,
    message: { subject, html }
  });
  return mailRef;
}
