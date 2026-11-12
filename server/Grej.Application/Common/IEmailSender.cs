namespace Grej.Application.Common;

// Never throws: a lost email is only logged, so it never fails what sent it.
public interface IEmailSender
{
    Task SendAsync(EmailMessage message, CancellationToken cancellationToken);
}
