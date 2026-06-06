import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const APP_NAME = 'Magnolia Royale';
const SUPPORT_EMAIL = 'contato@magnoliaroyale.com.br';

const emailTemplates = {
  approved: (clinicName: string, email: string, password: string) => ({
    subject: `✅ ${clinicName} foi aprovada na ${APP_NAME}!`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #5C7A4B; padding: 40px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">${APP_NAME}</h1>
        </div>
        <div style="padding: 40px; background: #FAF8F5;">
          <h2 style="color: #5C7A4B;">Parabéns, ${clinicName}!</h2>
          <p>Sua clínica foi aprovada em nosso processo de validação.</p>
          <p><strong>Seus dados de acesso:</strong></p>
          <p>E-mail: ${email}<br>Senha: ${password}</p>
          <a href="https://magnoliaroyale-b5afb.web.app/login" 
             style="background: #C9A84C; color: #fff; padding: 12px 32px; text-decoration: none; border-radius: 50px; display: inline-block; margin-top: 20px;">
            Acessar Plataforma
          </a>
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
      const template = emailTemplates.approved(after.name, userData.email, 'senha_temporaria');
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
